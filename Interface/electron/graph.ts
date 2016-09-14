import fs = require("fs");
import xml2js = require('xml2js');

enum Chord { Major, Minor, Invalid }
class Song { BPM : Number; Title : string; Artist : string; Key : [Number, Chord]; AudioId : string }
class Edge { Weight : Number; From : Song; To : Song }

//The "punishment" for having a bad key transition.
const BADKEYWEIGHT = 15.0

class CollectionParser {
    ///Parse a .nml collection into a Song list.
    parseCollection (pathToCollection : string) {
        function parseXML() {
            var parsed;
            var parser = new xml2js.Parser();
            var result = fs.readFileSync(pathToCollection, "utf8");
            parser.parseString(result, function (err, result) {
                parsed = result;
            });
            return parsed.NML.COLLECTION[0].ENTRY;
        }

        ///Parse string keys from KEY.INFO attribute in NML.
        function parseKey (s:string) : [number, Chord]{
            var regex = new RegExp("\d+");
            var result = regex.exec(s);
            var key = s.indexOf("d") > 0 ? Chord.Major : Chord.Minor

            var num = Number(result[0])
            num = isNaN(num) ? num = 0 : num 
            return [num, key]
        }

        ///Parse integer key from MUSICAL_KEY attribute in NML to Key.
        function parseMusicalKey(k:Number) : [number, Chord]{
            switch(k) {
                case 0: return [1, Chord.Major];
                case 1: return [8, Chord.Major];
                case 2: return [3, Chord.Major];
                case 3: return [10, Chord.Major];
                case 4: return [5, Chord.Major];
                case 5: return [12, Chord.Major];
                case 6: return [7, Chord.Major];
                case 7: return [2, Chord.Major];
                case 8: return [9, Chord.Major];
                case 9: return [4, Chord.Major];
                case 10: return [11, Chord.Major];
                case 11: return [6, Chord.Major];
                case 12: return [10,Chord.Minor];
                case 13: return [5, Chord.Minor];
                case 14: return [12, Chord.Minor];
                case 15: return [7, Chord.Minor];
                case 16: return [2, Chord.Minor];
                case 17: return [9, Chord.Minor];
                case 18: return [4, Chord.Minor];
                case 19: return [11, Chord.Minor];
                case 20: return [6, Chord.Minor];
                case 21: return [1, Chord.Minor];
                case 22: return [8, Chord.Minor];
                case 23: return [3, Chord.Minor];
                default: return [0, Chord.Invalid];
            }
        }

        ///Parse a given NML Entry into a Song type.
        function parseToSong (entry) : Song {
            var te = entry.TEMPO;
            var ti = entry.$.TITLE;
            var a = entry.$.ARTIST;
            var mk = entry.MUSICAL_KEY;
            var ik = entry.INFO.KEY;
            var id = entry.LOCATION[0].$.FILE;

            if(te == undefined || id == undefined) {
                return { BPM: 0.0, Title: "", Artist: "", Key: [0, Chord.Invalid], AudioId: "" }
            }

            return (mk != undefined) 
                 ? { BPM: te[0].$.BPM, Title: ti, Artist: a, Key: parseMusicalKey(+mk[0].$.VALUE), AudioId: id }
                 : { BPM: te[0].$.BPM, Title: ti, Artist: a, Key: parseKey(ik), AudioId: id }
        }

        var collection = parseXML();
        var songs = collection.map(parseToSong);
        return songs;
    }
}

class Graph {
    ///Calculate weights for a (Song * Edge list) array.
    ///Create a graph (represented as a Song * Edge list array) from  a Song list.
    buildGraph (list: Song[], numberOfEdges:Number) {
        ///Calculate the weight from a given Key to another Key.
        function weightForKey (key : [Number, Chord], other : [Number, Chord]) {
            var accountFor12 = (n:number) => n % 12 == 0 ? 12 : n % 12;
            var plusOne = accountFor12 (+key[0] + 1)            //One key up
            var minusOne = accountFor12 (+key[0] + 11)          //One key down.
            var oneSemitone = accountFor12 (+key[0] + 2)        //One semitone up.
            var twoSemitones = accountFor12 (+key[0] + 7)       //two semitones up.
            function threeUpDown(k) {
                //If Chord.Minor, three keys UP, if Chord.Major three keys DOWN.
                if (k == Chord.Minor) return accountFor12 (+key[0] + 3); 
                else if (k == Chord.Major) return accountFor12 (+key[0] + 9);
                return Number.MAX_VALUE;
            }

            //Create a list of all good key transitions.
            var lst = [ plusOne, minusOne, oneSemitone, twoSemitones, threeUpDown(other[1]) ]
            //See if other key matches any of the good key transitions.
            let filtered = lst.filter (x => other[0] == x)
            //If there were any matches, then it's a nice key transition.
            return filtered.length == 0 ? BADKEYWEIGHT : 0.0
        }

        function calculateWeight (fromSong:Song, toSong:Song) : Edge {
            var bpmDifference = Math.abs(+fromSong.BPM - +toSong.BPM);
            var keyWeight = weightForKey(fromSong.Key, toSong.Key);

            var weight = bpmDifference + keyWeight
            return { Weight: weight, From: fromSong, To: toSong }
        }

        function generateEdges (song:Song, songs:Song[]) {
            ///Take n elements from a given list until there are no more elements.
            function take (n:Number, list: any[]) {
                var acc = [];
                function takeAcc (n, list:any[]) : any[] {
                    if (list.length <= 0) { 
                        return acc;
                    } 
                    if (n > 0) { 
                        acc.push(list[0]);
                        return takeAcc((n-1), list.slice(1)); 
                    } 
                    else { 
                        return acc; 
                    }
                }
                return takeAcc(n, list);
            }

            function findOtherSongs (array:Song[]) { 
                return array.filter (s => (s != song));
            }
            var createEdgesFromSong = 
                (songs) => {
                    var all = findOtherSongs(songs).map(s => calculateWeight(song, s)).sort((s1, s2) => +(s1.Weight > s2.Weight));
                    return take(numberOfEdges, all).reverse();
            }

            let result = createEdgesFromSong(songs);
            return [song, result];
        }

        var withEdges = list.map (entry => generateEdges(entry, list));
        return withEdges;
    }

    ///Create a Map<audioId:string, (Song * Edge list)> from a Song * Edge list array.
    asMap(graph : [Song, Edge[]][]) {
        let mapped = graph.map(x => [x[0].AudioId, x]);
        return mapped;
    }
}

module.exports = {
    parseCollection: new CollectionParser().parseCollection,
    buildGraph: new Graph().buildGraph,
    asMap: new Graph().asMap
}