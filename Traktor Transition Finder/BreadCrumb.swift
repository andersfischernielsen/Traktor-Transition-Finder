//
//  BreadCrumb.swift
//  TestBreadCrumbs
//
//  Created by Anders Fischer-Nielsen on 29/05/2019.
//  Copyright © 2019 Anders Fischer-Nielsen. All rights reserved.
//

import Foundation
import Cocoa

class BreadCrumb: NSCollectionViewItem {
    var selectedSong: Song?
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    override func mouseDown(with theEvent: NSEvent) {
        if theEvent.clickCount == 2 {
            NSApplication.shared.sendAction(#selector(DragDropViewController.breadCrumbClicked), to: nil, from: self)
        }
    }
}
