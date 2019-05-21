import Foundation
import Cocoa


class DragDropViewController: NSViewController {
    @IBOutlet var dropZone: DestinationView!
    @IBOutlet weak var transitionsTableView: NSTableView!
    @IBOutlet weak var dropTextField: NSTextField!
    var transitions = [String]()
    var graph: [String: (Song, [Edge])] = [:]
    var collectionURL: URL? {
        didSet {
            if collectionURL == nil {
                self.view.window?.level = NSWindow.Level.init(rawValue: 0)
            }
            else {
                updateCollection(path: collectionURL)
            }
        }
    }
    
    enum Appearance {
        static let shadowOpacity: Float =  0.4
        static let shadowOffset: CGFloat = 4
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        dropZone.delegate = self
        if (collectionURL == nil) {
            selectCollection()
        }
    }
    
    func updateCollection(path: URL?) {
        DispatchQueue.global(qos: .background).async {
            DispatchQueue.main.async {
                self.dropTextField.stringValue = "Parsing Traktor Collection..."
            }
            let parsed = CollectionParser.parseCollection(pathToCollection: self.collectionURL!)
            DispatchQueue.main.async {
                self.dropTextField.stringValue = "Building Song Graph..."
            }
            let graph = Graph.buildGraph(list: parsed, numberOfEdges: 5)
            self.graph = graph
            
            DispatchQueue.main.async {
                self.dropTextField.stringValue = "Drop Songs Here"
            }
        }
        
        
    }

    func selectCollection() {
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
            }
            else if self.collectionURL == nil {
                NSApplication.shared.terminate(self)
            }
        }
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
  
  func processFileURLs(_ urls: [URL]) {
    let key = urls.first!
        .absoluteString.replacingOccurrences(of: "file://", with: "")
        .replacingOccurrences(of: " ", with: "%20")
    transitions = (graph[key]?.1.map { e in return e.To.AudioId })!
    transitionsTableView.dataSource = self as NSTableViewDataSource
  }
}

extension DragDropViewController: NSTableViewDataSource {
  func numberOfRows(in tableView: NSTableView) -> Int {
    return transitions.count
  }
}

extension DragDropViewController: NSTableViewDelegate {
  func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
    let item = transitions[row]
    let cell = tableView.makeView(withIdentifier: (tableColumn!.identifier), owner: self) as? NSTableCellView
    cell?.textField?.stringValue = item
    return cell
  }
}
