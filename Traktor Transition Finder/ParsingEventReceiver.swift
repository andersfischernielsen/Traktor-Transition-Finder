//
//  CollectionDelegate.swift
//  Traktor Transition Finder
//
//  Created by Anders Fischer-Nielsen on 31/05/2019.
//  Copyright © 2019 Anders Fischer-Nielsen. All rights reserved.
//

import Foundation

protocol ParsingEventReceiver {
    var to: ParsingEventReceiver? { get set }
    func parsingStarted() -> Void
    func buildingStarted() -> Void
    func buildingFinished() -> Void
}
