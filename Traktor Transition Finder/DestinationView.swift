import Cocoa
import AppKit.NSPasteboard

protocol DestinationViewDelegate {
    func processFileURLs(_ urls: [URL], index: Int?) -> Bool
}

class DestinationView: NSView {
    var userInteractionEnabled: Bool = false
    var index: Int?

  let filteringOptions = [NSPasteboard.ReadingOptionKey.urlReadingContentsConformToTypes: NSSound.soundUnfilteredTypes]
  func shouldAllowDrag(_ draggingInfo: NSDraggingInfo) -> Bool {
    let pasteBoard = draggingInfo.draggingPasteboard
    return pasteBoard.canReadObject(forClasses: [NSURL.self], options: filteringOptions)
  }

  enum Appearance {
    static let lineWidth: CGFloat = 10.0
  }

  var delegate: DestinationViewDelegate?
    var acceptableTypes: Set<NSPasteboard.PasteboardType> { return [NSPasteboard.PasteboardType(kUTTypeURL as String)] }

  override func awakeFromNib() {
    setup()
  }

  func setup() {
    registerForDraggedTypes(Array(acceptableTypes))
  }

  override func draw(_ dirtyRect: NSRect) {
    if isReceivingDrag {
      NSColor.selectedControlColor.set()

      let path = NSBezierPath(rect: bounds)
      path.lineWidth = Appearance.lineWidth
      path.stroke()
    }
  }

  override func hitTest(_ aPoint: NSPoint) -> NSView? {
    return userInteractionEnabled ? self : nil
  }

  var isReceivingDrag = false {
    didSet {
      needsDisplay = true
    }
  }

  override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
    let allow = shouldAllowDrag(sender)
    isReceivingDrag = allow
    return allow ? .copy : NSDragOperation()
  }

  override func draggingExited(_ sender: NSDraggingInfo?) {
    isReceivingDrag = false
  }

  override func prepareForDragOperation(_ sender: NSDraggingInfo) -> Bool {
    let allow = shouldAllowDrag(sender)
    return allow
  }

  override func performDragOperation(_ draggingInfo: NSDraggingInfo) -> Bool {
    isReceivingDrag = false
    let pasteBoard = draggingInfo.draggingPasteboard
    if let urls = pasteBoard.readObjects(forClasses: [NSURL.self], options: filteringOptions) as? [URL], urls.count > 0 {
        if let result = delegate?.processFileURLs(urls, index: index) {
            return result
        }
    }
    return false
  }
}
