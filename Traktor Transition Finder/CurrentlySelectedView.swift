//
//  BottomView.swift
//  Traktor Transition Finder
//
//  Created by Anders Fischer-Nielsen on 30/05/2019.
//  Copyright © 2019 Anders Fischer-Nielsen. All rights reserved.
//

import Foundation
import Cocoa

class CurrentlySelectedView : NSView {
    override func hitTest(_ point: NSPoint) -> NSView? {
        return nil
    }
}
