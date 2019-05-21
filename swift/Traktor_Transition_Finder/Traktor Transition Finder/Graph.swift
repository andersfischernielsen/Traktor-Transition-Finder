//
// Created by Anders Fischer-Nielsen on 2019-05-21.
// Copyright (c) 2019 ___FULLUSERNAME___. All rights reserved.
//

import Foundation
import Foundation.NSRegularExpression
import Ji

enum Chord { case Major,  Minor, Invalid }
struct Song {
    let BPM: Double
    let Title: String
    let Artist: String
    let Key: (Int, Chord)
    let AudioId: String
    
    static func != (s1:Song,s2:Song) -> Bool
    {
        return (s1.BPM != s2.BPM && s1.Title != s2.Title && s1.Artist != s2.Artist && s1.AudioId != s2.AudioId)
    }
}

struct Edge {
    let Weight: Double
    let From: Song
    let To: Song
}
struct XMLEntry {
    let BPM: String?
    let Title: String?
    let Artist: String?
    let MusicalKey: String?
    let InfoKey: String?
    let AudioId: String?
}

//The "punishment" for having a bad key transition.
let BADKEYWEIGHT = 15.0

class CollectionParser {
        func parseXML(path: URL) -> [XMLEntry] {
            var entries: [XMLEntry] = []
            do {
                let file = try String(contentsOf: path, encoding: .utf8)
                let document = Ji(xmlString: file)
                if let documentEntries = document?.xPath("//ENTRY") {
                    //TODO: Convert into map()
                    for entry in documentEntries {
                        let te = entry.xPath("//TEMPO/@BPM")[0].content
                        let ti = entry.xPath("//ENTRY/@TITLE")[0].content
                        let a = entry.xPath("//ENTRY/@ARTIST")[0].content
                        let mk = entry.xPath("//MUSICAL_KEY/@VALUE")[0].content
                        let ik = entry.xPath("//INFO/@KEY")[0].content
                        let id = entry.xPath("//LOCATION/@FILE")[0].content
                        entries.append(XMLEntry(BPM: te, Title: ti, Artist: a, MusicalKey: mk, InfoKey: ik, AudioId: id))
                    }
                }
            } catch let error {
                print(error)
            }
            return entries
        }

    ///Parse string keys from KEY.INFO attribute in NML.
    func parseKey(s: String) -> (Int, Chord) {
        func matches(for regex: String, in text: String) -> [String] {
            do {
                let regex = try NSRegularExpression(pattern: regex)
                let results = regex.matches(in: text,
                        range: NSRange(text.startIndex..., in: text))
                return results.map {
                    String(text[Range($0.range, in: text)!])
                }
            } catch let error {
                print("invalid regex: \(error.localizedDescription)")
                return []
            }
        }

        let regex = matches(for: "+d", in: s)
        let num = Int(regex[0]) ?? 0
        let key: Chord = s.contains("d") ? Chord.Major : Chord.Minor
        return (num, key)
    }

    ///Parse integer key from MUSICAL_KEY attribute in NML to Key.
    func parseMusicalKey(k: Int) -> (Int, Chord) {
        switch k {
            case 0:
                return (1, Chord.Major)
            case 1:
                return (8, Chord.Major)
            case 2:
                return (3, Chord.Major)
            case 3:
                return (10, Chord.Major)
            case 4:
                return (5, Chord.Major)
            case 5:
                return (12, Chord.Major)
            case 6:
                return (7, Chord.Major)
            case 7:
                return (2, Chord.Major)
            case 8:
                return (9, Chord.Major)
            case 9:
                return (4, Chord.Major)
            case 10:
                return (11, Chord.Major)
            case 11:
                return (6, Chord.Major)
            case 12:
                return (10, Chord.Minor)
            case 13:
                return (5, Chord.Minor)
            case 14:
                return (12, Chord.Minor)
            case 15:
                return (7, Chord.Minor)
            case 16:
                return (2, Chord.Minor)
            case 17:
                return (9, Chord.Minor)
            case 18:
                return (4, Chord.Minor)
            case 19:
                return (11, Chord.Minor)
            case 20:
                return (6, Chord.Minor)
            case 21:
                return (1, Chord.Minor)
            case 22:
                return (8, Chord.Minor)
            case 23:
                return (3, Chord.Minor)
            default:
                return (0, Chord.Invalid)
    }

    ///Parse a given NML Entry into a Song type.
    func parseToSong(entry: XMLEntry) -> Song {
        if (entry.BPM == nil || entry.AudioId == nil) {
            return Song(BPM: 0, Title: "", Artist: "", Key: (0, Chord.Invalid), AudioId: "")
        }
        
        let te = Double(entry.BPM!)!
        let ti = entry.Title!
        let ar = entry.Artist!
        let id = entry.AudioId!
        
        if entry.MusicalKey != nil {
            let key = Int(entry.MusicalKey!)!
            return Song(BPM: te, Title: ti, Artist: ar, Key: parseMusicalKey(k: key), AudioId: id)
        } else {
            let key = entry.InfoKey!
            return Song(BPM: te, Title: ti, Artist: ar, Key: parseKey(s: key), AudioId: id)
        }
    }

        ///Parse a .nml collection into a Song list.
    func parseCollection(pathToCollection: String) -> [Song] {
        var songs: [Song] = []
        let url = URL(fileURLWithPath: pathToCollection)
        let xmlEntries = parseXML(path: url)
        for entry in xmlEntries {
            songs.append(parseToSong(entry: entry))
        }
        return songs
    }
}
}

class Graph {
    ///Calculate the weight from a given Key to another Key.
    func weightForKey(key: (Int, Chord), other: (Int, Chord)) -> Double {
        func accountFor12 (n: Int) -> Int {
                return (n % 12 == 0 ? 12 : n % 12)
            }
        let plusOne = accountFor12(n: key.0 + 1) //One key up
        let minusOne = accountFor12(n: key.0 + 11) //One key down.
        let oneSemitone = accountFor12(n: key.0 + 2) //One semitone up.
        let twoSemitones = accountFor12(n: key.0 + 7) //two semitones up.
        func threeUpDown (k: Chord) -> Int {
            //If Chord.Minor, three keys UP, if Chord.Major three keys DOWN.
            if k == Chord.Minor {
                return accountFor12(n: key.0 + 3)
            }
            else if k == Chord.Major {
                return accountFor12(n: key.0 + 9)
            }
            else {
                return Int.max
            }
        }
        
        //Create a list of all good key transitions.
        let lst = [
            plusOne,
            minusOne,
            oneSemitone,
            twoSemitones,
            threeUpDown(k: other.1)
        ]
        
        //See if other key matches any of the good key transitions.
        let filtered = lst.filter({(x: Int) -> Bool in other.0 == x})
        //If there were any matches, then it's a nice key transition.
        return filtered.count == 0 ? BADKEYWEIGHT : 0.0
    }

    func generateEdge(fromSong: Song, toSong: Song) -> Edge {
        let bpmDifference = abs(fromSong.BPM - toSong.BPM)
        let keyWeight = weightForKey(key: fromSong.Key, other: toSong.Key)

        let weight = bpmDifference + keyWeight
        return Edge (Weight: weight, From: fromSong, To: toSong)
    }

    ///Create a Map<audioId:string, (Song * Edge list)> from a Song * Edge list array.
    func asMap(graph: [(Song, [Edge])]) -> [String: (Song, [Edge])] {
        var m: [String: (Song, [Edge])] = [:]
        graph.forEach({ m[$0.0.AudioId] = $0 })
        return m
    }
    
    ///Calculate weights for a (Song * Edge list) array.
    ///Create a graph (represented as a Song * Edge list array) from  a Song list.
    func buildGraph(list: [Song], numberOfEdges: Int) -> (Song, [Edge]) {
        func generateEdgesForSong(song: Song, songs: [Song]) -> (Song, [Edge]) {
            func createEdgesFromSong(songs: [Song]) -> (Song, [Edge]) {
                let otherSongs = songs.filter({ $0 != song })
                let withEdges = otherSongs.map( { generateEdge(fromSong: song, toSong: $0) })
                let sorted = withEdges.sorted(by: { $0.Weight < $1.Weight })
                return (song, Array(sorted.prefix(numberOfEdges)))
            }
            
            return createEdgesFromSong(songs: songs)
        }
        
        let result = list.map({ generateEdgesForSong(song: $0, songs: list) })[0]
        return result
    }
}
