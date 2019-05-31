import Foundation
import Cocoa

class DragDropViewController: NSViewController {
    @IBOutlet var currentlySelectedTitle: NSTextField!
    @IBOutlet var currentlySelectedArtist: NSTextField!
    @IBOutlet var currentlySelectedKeyView: NSTextField!
    @IBOutlet var currentlySelectedTempoView: NSTextField!
    @IBOutlet var currentlySelectedView: CurrentlySelectedView!
    
    @IBOutlet var dropZone: DestinationView!
    @IBOutlet weak var transitionsTableView: NSTableView!
    @IBOutlet weak var dropTextField: NSTextField!
    @IBOutlet var breadCrumbView: NSCollectionView!
    
    var songToSongWindow: NSWindowController?
    
    var transitions: [Edge]? {
        didSet {
            transitionsTableView.reloadData()
        }
        willSet(value) {
            dropZone.userInteractionEnabled = value != nil
            transitionsTableView.isEnabled = value != nil
        }
    }
    
    var graph: [String: (Song, [Edge])]? {
        get {
            return Graph.shared.graph
        }
    }
    
    var breadCrumbs: [Song] = []
    var to: ParsingEventReceiver?
    
    @IBAction func openDocument(_ sender: Any?) {
        let openPanel = NSOpenPanel()
        openPanel.allowsMultipleSelection = false
        openPanel.canChooseDirectories = false
        openPanel.canCreateDirectories = false
        openPanel.canChooseFiles = true
        openPanel.allowedFileTypes = ["nml"]
        openPanel.level = NSWindow.Level.init(rawValue: 1)
        openPanel.begin { (result) -> Void in
            if result == .OK {
                if let url = openPanel.url {
                    self.updateSharedCollection(path: url)
                }
            }
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        dropZone.delegate = self
        breadCrumbView.dataSource = self
        transitionsTableView.delegate = self
        transitionsTableView.dataSource = self
        transitionsTableView.target = self
        transitionsTableView.doubleAction = #selector(tableViewDoubleClick(_:))
    }
    
    @objc func breadCrumbClicked(sender: Any?) {
        guard sender is BreadCrumb else { return }
        let breadCrumb = sender as! BreadCrumb
        if let selected = breadCrumb.selectedSong {
            selectSong(audioID: selected.audioId)
        }
    }
    
    func appendBreadCrumb(song: Song) {
        if breadCrumbs.count > 3 {
            breadCrumbs.remove(at: 0)
        }
        breadCrumbs.append(song)
        breadCrumbView.reloadData()
    }
    
    func selectSong(audioID: String) {
        transitions = (graph?[audioID]?.1.map { edge in return edge })
        
        if (transitions != nil) {
            if let result = graph?[audioID] {
                setCurrentlySelected(song: result.0)
            }
        }
    }
    
    func setCurrentlySelected(song: Song) {
        currentlySelectedTitle.stringValue = song.title
        currentlySelectedArtist.stringValue = song.artist
        let scale = song.key.1 == .Major ? "D" : "M"
        currentlySelectedKeyView.stringValue = "\(String(song.key.0))\(scale)"
        currentlySelectedTempoView.stringValue = String(format: "%.2f", song.bpm)
        appendBreadCrumb(song: song)
    }

    @objc func tableViewDoubleClick(_ sender: AnyObject) {
        if let item = transitions?[transitionsTableView.selectedRow] {
            selectSong(audioID: item.to.audioId)
        }
    }

    enum Appearance {
        static let shadowOpacity: Float =  0.4
        static let shadowOffset: CGFloat = 4
    }

    func configureShadow(_ view: NSView) {
        if let layer = view.layer {
          layer.shadowColor = NSColor.black.cgColor
          layer.shadowOpacity = Appearance.shadowOpacity
          layer.shadowOffset = CGSize(width: Appearance.shadowOffset, height: -Appearance.shadowOffset)
          layer.masksToBounds = false
        }
    }
    
    @IBAction func showSongToSong(_ sender: Any?) {
        if let window = songToSongWindow {
            window.showWindow(self)
            return
        }
        if let songToSongWindow = NSStoryboard(name: "Main", bundle: nil).instantiateController(withIdentifier: "SongToSongWindowController") as? NSWindowController,
            let viewController = songToSongWindow.window!.contentViewController as? ParsingEventReceiver {
                self.songToSongWindow = songToSongWindow
                to = viewController
                to?.to = self
                songToSongWindow.showWindow(self)
        }
    }
    
    func updateSharedCollection(path: URL) {
        DispatchQueue.global(qos: .background).async {
            DispatchQueue.main.async {
                self.parsingStarted()
                self.to?.parsingStarted()
            }
            let parsed = CollectionParser.parseCollection(pathToCollection: path)
            DispatchQueue.main.async {
                self.buildingStarted()
                self.to?.buildingStarted()
            }
            Graph.shared.graph = Graph.buildGraph(list: parsed, numberOfEdges: nil)
            DispatchQueue.main.async {
                self.finished()
                self.to?.finished()
            }
        }
    }
}

extension DragDropViewController: NSCollectionViewDataSource {
    func collectionView(_ collectionView: NSCollectionView, numberOfItemsInSection section: Int) -> Int {
        return breadCrumbs.count
    }
    
    func collectionView(_ collectionView: NSCollectionView, itemForRepresentedObjectAt indexPath: IndexPath) -> NSCollectionViewItem {
        let item = collectionView.makeItem(withIdentifier: NSUserInterfaceItemIdentifier(rawValue: "BreadCrumb"), for: indexPath)
        guard item is BreadCrumb else { return item }
        let breadCrumb = item as! BreadCrumb
        let song = breadCrumbs[indexPath.item]
        breadCrumb.textField?.stringValue = song.title
        breadCrumb.selectedSong = song
        return item
    }
    
    func numberOfSections(in collectionView: NSCollectionView) -> Int {
        return 1
    }
}

extension DragDropViewController: DestinationViewDelegate {
    func processFileURLs(_ urls: [URL], index: Int?) -> Bool {
        if let key = urls.first!.absoluteString
            .replacingOccurrences(of: " ", with: "%20")
            .components(separatedBy: "/").last {
            selectSong(audioID: key)
            return transitions != nil
        }
        return false
    }
}

extension DragDropViewController: NSTableViewDataSource {
    func numberOfRows(in tableView: NSTableView) -> Int {
        return transitions?.count ?? 0
    }
}

extension DragDropViewController: NSTableViewDelegate {
    func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
        if let item = transitions?[row],
           let cell = tableView.makeView(withIdentifier: NSUserInterfaceItemIdentifier(rawValue: "TransitionTableCell"), owner: nil) as? TransitionTableCellView {
            cell.title.stringValue = item.to.title
            cell.artist.stringValue = item.to.artist
            cell.tempo.stringValue = String(format: "%.2f", item.to.bpm)
            let scale = item.to.key.1 == .Major ? "D" : "M"
            cell.key.stringValue = "\(String(item.to.key.0))\(scale)"
            cell.index = item.to.audioId
            return cell
        }
        return nil
    }
}

extension DragDropViewController:  ParsingEventReceiver {
    func parsingStarted() {
        self.dropTextField.stringValue = "Parsing Collection..."
    }
    
    func buildingStarted() {
        self.dropTextField.stringValue = "Building Transitions..."
    }
    
    func finished() {
        self.dropTextField.stringValue = "Drop Songs Here"
    }
}
