import Foundation
import Cocoa

class DragDropViewController: NSViewController {
    @IBOutlet var dropZone: DestinationView!
    @IBOutlet weak var transitionsTableView: NSTableView!
    @IBOutlet weak var dropTextField: NSTextField!
    var transitions: [Edge]? {
        didSet {
            transitionsTableView.reloadData()
        }
        willSet(value) {
            dropZone.userInteractionEnabled = value != nil
            transitionsTableView.isEnabled = value != nil
        }
    }
    var graph: [String: (Song, [Edge])] = [:]
    var collectionURL: URL? {
        didSet {
            updateCollection(path: collectionURL)
        }
    }
    var currentTransitions: [Song]?

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
                self.collectionURL = openPanel.url
            } else if self.collectionURL == nil {
                NSApplication.shared.terminate(self)
            }
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        dropZone.delegate = self
        transitionsTableView.delegate = self
        transitionsTableView.dataSource = self
        transitionsTableView.target = self
        transitionsTableView.action = #selector(tableViewClick(_:))
    }

    @objc func tableViewClick(_ sender: AnyObject) {
        if let item = transitions?[transitionsTableView.selectedRow] {
            transitions = (graph[item.to.audioId]?.1.map { edge in return edge })
            currentTransitions = transitions?.map { $0.to }
        }
    }

    func updateCollection(path: URL?) {
        DispatchQueue.global(qos: .background).async {
            DispatchQueue.main.async {
                self.dropTextField.stringValue = "Parsing Traktor Collection..."
            }
            let parsed = CollectionParser.parseCollection(pathToCollection: self.collectionURL!)
            DispatchQueue.main.async {
                self.dropTextField.stringValue = "Building Transitions..."
            }
            let graph = Graph.buildGraph(list: parsed, numberOfEdges: 15)
            self.graph = graph

            DispatchQueue.main.async {
                self.dropTextField.stringValue = "Drop Songs Here"
            }
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
}

extension DragDropViewController: DestinationViewDelegate {
    func processFileURLs(_ urls: [URL]) -> Bool {
        if let key = urls.first!.absoluteString
            .replacingOccurrences(of: " ", with: "%20")
            .components(separatedBy: "/").last {
            transitions = (graph[key]?.1.map { edge in return edge })
            currentTransitions = transitions?.map { $0.to }
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

    func tableView(_ tableView: NSTableView, heightOfRow row: Int) -> CGFloat {
        return 55 as CGFloat
    }
}
