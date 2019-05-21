import Cocoa


class DragDropViewController: NSViewController {
    @IBOutlet var dropZone: DestinationView!
    @IBOutlet weak var transitionsTableView: NSTableView!
    
    var transitions = [String]()
    
    
  enum Appearance {
    static let shadowOpacity: Float =  0.4
    static let shadowOffset: CGFloat = 4
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    dropZone.delegate = self
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
    transitions.append(contentsOf: urls.map({$0.absoluteString}))
    transitionsTableView.dataSource = self
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
    print(item)
    let cell = tableView.makeView(withIdentifier: (tableColumn!.identifier), owner: self) as? NSTableCellView
    cell?.textField?.stringValue = item
    return cell
  }
}
