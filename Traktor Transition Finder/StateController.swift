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

enum DonationState {
    case Donated
    case Ignored
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
    private var openedDialogLast = Date()
    private var listeners: [StateSubscriber]
    
    init() {
        self.state = .CollectionNotSelected
        self.listeners = []
    }
    
    func addListener(_ listener: StateSubscriber) {
        listeners.append(listener)
    }
    
    func checkDonationStatus() {
        func openDonateURL() {
            let url = URL(string: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ME8E22EZTC5G4&source=url")
            NSWorkspace.shared.open(url!)
        }
        
        let donated = UserDefaults.standard.bool(forKey: "alreadyDonated")
        let interval = DateInterval(start: self.openedDialogLast, end: Date())
        if (!donated && interval.duration/60 > 5) {
            let alert = NSAlert()
            alert.messageText = "Please consider supporting the development of Traktor Transition Finder"
            alert.informativeText = "Developing software takes time and ressources. \nPlease consider donating to support the development and improvement of Traktor Transition Finder."
            alert.alertStyle = .informational
            let alreadyDonatedButton = alert.addButton(withTitle: "I Have Already Donated")
            let ignoreButton = alert.addButton(withTitle: "Ignore")
            let donateButton = alert.addButton(withTitle: "Donate")
            alreadyDonatedButton.keyEquivalent = ""
            ignoreButton.keyEquivalent = "\033"
            donateButton.keyEquivalent = "\r"
            let response = alert.runModal()
            if response == .alertThirdButtonReturn {
                UserDefaults.standard.set(false, forKey: "alreadyDonated")
                openDonateURL()
            }
            else if (response == .alertFirstButtonReturn) {
                UserDefaults.standard.set(true, forKey: "alreadyDonated")
            }
            else {
                UserDefaults.standard.set(false, forKey: "alreadyDonated")
            }
            self.openedDialogLast = Date()
        }
    }
}
