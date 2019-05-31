import Foundation
import Cocoa

class SongToSongViewController: NSViewController {
    @IBOutlet var dropZoneFrom: DestinationView!
    @IBOutlet var dropZoneTo: DestinationView!
    @IBOutlet weak var dropTextFieldFrom: NSTextField!
    @IBOutlet weak var dropTextFieldTo: NSTextField!
    
    @IBOutlet weak var transitionsTableView: NSTableView!
    @IBOutlet var breadCrumbView: NSCollectionView!
    
    var breadCrumbs: [Song?] = []
    var firstSong: Song?
    var secondSong: Song?
    
    var transitions: [Song]? {
        didSet {
            transitionsTableView.reloadData()
        }
        willSet(value) {
            dropZoneTo.userInteractionEnabled = value != nil
            dropZoneFrom.userInteractionEnabled = value != nil
            transitionsTableView.isEnabled = value != nil
        }
    }
    
    var graph: [String: (Song, [Edge])]? {
        get {
            return Graph.shared.graph
        }
    }
    
    var to: ParsingEventReceiver?

    override func viewDidLoad() {
        super.viewDidLoad()
        dropZoneFrom.delegate = self
        dropZoneFrom.index = 0
        dropZoneTo.delegate = self
        dropZoneTo.index = 1
        transitionsTableView.delegate = self
        transitionsTableView.dataSource = self
        transitionsTableView.target = self
        breadCrumbView.dataSource = self
        if (graph != nil) {
            buildingFinished()
        }
    }
    
    func selectSong(audioID: String, index: Int) {
        guard index < 2 else { return }
        if let song = graph?[audioID]?.0 {
            if (breadCrumbs.count == 0 || breadCrumbs.count < index) {
                breadCrumbs.append(nil)
                breadCrumbs.append(nil)
            }
            breadCrumbs[index] = song
            breadCrumbView.reloadData()
            if index == 0 { firstSong = song }
            else { secondSong = song }
        }
        
        if let first = firstSong, let second = secondSong, let g = graph {
            transitions = PathFinder.findPathBetween(first, to: second, in: g)
        }
    }
    
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
                self.buildingFinished()
                self.to?.buildingFinished()
            }
        }
    }
    
}

extension SongToSongViewController: NSCollectionViewDataSource {
    func collectionView(_ collectionView: NSCollectionView, numberOfItemsInSection section: Int) -> Int {
        return breadCrumbs.count
    }
    
    func collectionView(_ collectionView: NSCollectionView, itemForRepresentedObjectAt indexPath: IndexPath) -> NSCollectionViewItem {
        let item = collectionView.makeItem(withIdentifier: NSUserInterfaceItemIdentifier(rawValue: "BreadCrumb"), for: indexPath)
        let song = breadCrumbs[indexPath.item]
        guard item is BreadCrumb && song != nil else { return item }
        let breadCrumb = item as! BreadCrumb
        breadCrumb.textField?.stringValue = song!.title
        breadCrumb.selectedSong = song
        return item
    }
    
    func numberOfSections(in collectionView: NSCollectionView) -> Int {
        return 1
    }
}

extension SongToSongViewController: DestinationViewDelegate {
    func processFileURLs(_ urls: [URL], index: Int?) -> Bool {
        if let key = urls.first!.absoluteString
            .replacingOccurrences(of: " ", with: "%20")
            .components(separatedBy: "/").last {
            selectSong(audioID: key, index: index!)
            return firstSong != nil || secondSong != nil || transitions != nil
        }
        return false
    }
}

extension SongToSongViewController: NSTableViewDataSource {
    func numberOfRows(in tableView: NSTableView) -> Int {
        return transitions?.count ?? 0
    }
}

extension SongToSongViewController: NSTableViewDelegate {
    func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
        if let item = transitions?[row],
           let cell = tableView.makeView(withIdentifier: NSUserInterfaceItemIdentifier(rawValue: "TransitionTableCell"), owner: nil) as? TransitionTableCellView {
            cell.title.stringValue = item.title
            cell.artist.stringValue = item.artist
            cell.tempo.stringValue = String(format: "%.2f", item.bpm)
            let scale = item.key.1 == .Major ? "D" : "M"
            cell.key.stringValue = "\(String(item.key.0))\(scale)"
            cell.index = item.audioId
            return cell
        }
        return nil
    }
}

extension SongToSongViewController: ParsingEventReceiver {
    func parsingStarted() {
        self.dropTextFieldFrom.stringValue = "Parsing Collection..."
        self.dropTextFieldTo.stringValue = "Parsing Collection..."
    }
    
    func buildingStarted() {
        self.dropTextFieldFrom.stringValue = "Building Transitions..."
        self.dropTextFieldTo.stringValue = "Building Transitions..."
    }
    
    func buildingFinished() {
        self.dropTextFieldFrom.stringValue = "Drop Songs Here"
        self.dropTextFieldTo.stringValue = "Drop Songs Here"
    }
}
