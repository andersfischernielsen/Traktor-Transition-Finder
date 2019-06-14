//
//  PreferencesViewController.swift
//  Traktor Transition Finder
//
//  Created by Anders Fischer-Nielsen on 14/06/2019.
//  Copyright © 2019 Anders Fischer-Nielsen. All rights reserved.
//

import Foundation
import Cocoa

class PreferencesViewController: NSViewController {
    @IBOutlet var badKeyPunishmentSlider: NSSlider!
    @IBOutlet var halfTempoPunishmentSlider: NSSlider!
    @IBOutlet var badKeyPunishmentLabel: NSTextField!
    @IBOutlet var halfTempoPunishmentLabel: NSTextField!
    
    
    @IBAction func badKeyPunishmentSliderChanged(_ sender: Any) {
       let value = badKeyPunishmentSlider.doubleValue
        UserDefaults.standard.set(value, forKey: "badKeyPunishment")
        badKeyPunishmentLabel.stringValue = String(format: "%.2f", value)
        
    }
    
    @IBAction func halfTempoPunishmentSliderChanged(_ sender: Any) {
        let value = halfTempoPunishmentSlider.doubleValue
        UserDefaults.standard.set(value, forKey: "halfTempoPunishment")
        halfTempoPunishmentLabel.stringValue = String(format: "%.2f", value)
    }
    
    override func viewDidLoad() {
        if (UserDefaults.standard.double(forKey: "badKeyPunishment") != 0) {
            badKeyPunishmentLabel.stringValue = String(format: "%.2f", UserDefaults.standard.double(forKey: "badKeyPunishment"))
        }
        
        if (UserDefaults.standard.double(forKey: "halfTempoPunishment") != 0) {
            halfTempoPunishmentLabel.stringValue = String(format: "%.2f", UserDefaults.standard.double(forKey: "halfTempoPunishment"))
        }
    }
}
