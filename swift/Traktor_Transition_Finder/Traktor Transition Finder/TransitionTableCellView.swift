//
//  TransitionTableCellView.swift
//  Traktor Transition Finder
//
//  Created by Anders Fischer-Nielsen on 22/05/2019.
//  Copyright © 2019 Anders Fischer-Nielsen. All rights reserved.
//

import Cocoa

class TransitionTableCellView: NSTableCellView {
    @IBOutlet var title: NSTextField!
    @IBOutlet var artist: NSTextField!
    @IBOutlet var key: NSTextField!
    @IBOutlet var tempo: NSTextField!
    var index: String = ""
    
    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
    }
}
