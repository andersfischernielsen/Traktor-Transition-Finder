//
//  AppDelegate.swift
//  Traktor Transition Finder
//
//  Created by Anders Fischer-Nielsen on 2019-05-21.
//  Copyright © 2019 Anders Fischer-Nielsen. All rights reserved.
//

import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow?
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        
    }

    func applicationWillTerminate(_ aNotification: Notification) {
    // Insert code here to tear down your application
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
