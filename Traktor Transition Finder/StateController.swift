//
//  StateController.swift
//  Traktor Transition Finder
//
//  Created by Anders Fischer-Nielsen on 03/06/2019.
//  Copyright © 2019 Anders Fischer-Nielsen. All rights reserved.
//

import Foundation
import Cocoa

enum State {
    case CollectionNotSelected
    case ParsingCollectionStarted
    case BuildingTransitionsStarted
    case Ready
}

protocol StateSubscriber {
    func stateChanged(_ state: State) -> Void
}

class StateController {
    var state: State! {
        didSet {
            listeners.forEach { $0.stateChanged(self.state) }
        }
    }
    var graph: [String: (Song, [Edge])]?
    private var listeners: [StateSubscriber]
    
    init() {
        self.state = .CollectionNotSelected
        self.listeners = []
    }
    
    func addListener(_ listener: StateSubscriber) {
        listeners.append(listener)
    }
}
