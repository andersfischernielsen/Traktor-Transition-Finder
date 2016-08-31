enum Chord { Major, Minor, Invalid }
class Song { BPM : Number; Title : string; Artist : string; Key : [Number, Chord]; AudioId : string }
class Edge { Weight : Number; From : Song; To : Song }

//The "punishment" for having a bad key transition.
const BADKEYWEIGHT = 15.0

function CollectionParser() {
    ///Hash a given string using SHA256 (UTF-8)
    function hashString (s:string) {
        let sha256 = SHA256Managed.Create();
        let bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(s));
        Convert.ToBase64String(bytes);
    }

    ///Parse a .nml collection into a Song list.
    function parseCollection (pathToCollection : string) {
        var regex = new RegExp("\d+");

        ///Parse string keys from KEY.INFO attribute in NML.
        function parseKey (s:string) : [number, Chord]{
            var result = regex.exec(s);
            var key = s.indexOf("d") > 0 ? Chord.Major : Chord.Minor

            var num = Number(result[0])
            num = isNaN(num) ? num = 0 : num 
            return [num, key]
        }

        ///Parse integer key from MUSICAL_KEY attribute in NML to Key.
        function parseMusicalKey(k:number) : [number, Chord]{
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
        function parseToSong (i:Collection.Entry) {
            match i.Tempo, i.Title.String, i.Artist, i.MusicalKey, i.Info.Key, i.Location.File with
            //Use the main MUSICAL_KEY attribute if possible.
            | Some te, Some ti, Some a, Some k, _, id
                    -> { BPM = (float) te.Bpm; Title = ti; Artist = a;
                         Key = parseMusicalKey k.Value;
                         AudioId = hashString id }
            | Some te, _, Some a, Some k, _, id
                    -> { BPM = (float) te.Bpm; Title = unwrapString i.Title.String;
                         Artist = a;
                         Key = parseMusicalKey k.Value;
                         AudioId = hashString id }
            | Some te, Some ti, _, Some k, _, id
                    -> { BPM = (float) te.Bpm; Title = ti; Artist = unwrapString i.Artist;
                         Key = parseMusicalKey k.Value;
                         AudioId = hashString id }
            | Some te,  _, _, Some k, _, id
                    -> { BPM = (float) te.Bpm; Title = unwrapString i.Title.String;
                         Artist = unwrapString i.Artist;
                         Key = parseMusicalKey k.Value;
                         AudioId = hashString id }
            //If MUSICAL_KEY isn't available use INFO.KEY
            | Some te, Some ti, Some a, _, Some k, id
                    -> { BPM = (float) te.Bpm; Title = ti; Artist = a;
                         Key = parseKey k;
                         AudioId = hashString id }
            | Some te, _, Some a, _, Some k, id
                    -> { BPM = (float) te.Bpm; Title = unwrapString i.Title.String;
                         Artist = a;
                         Key = parseKey k;
                         AudioId = hashString id }
            | Some te, Some ti, _, _, Some k, id
                    -> { BPM = (float) te.Bpm; Title = ti; Artist = unwrapString i.Artist;
                         Key = parseKey k;
                         AudioId = hashString id }
            | Some te,  _, _, _, Some k, id
                    -> { BPM = (float) te.Bpm; Title = unwrapString i.Title.String;
                         Artist = unwrapString i.Artist;
                         Key = parseKey k;
                         AudioId = hashString id }
            //Invalid key info.
            | _     -> { BPM = 0.0; Title = String.Empty; Artist = String.Empty;
                         Key = (0, Invalid); AudioId = String.Empty}
        }

        var collection = Collection.Load(pathToCollection)
        var entries = collection.Collection.Entries2
        var songs = entries.map(parseToSong);
        songs
    }

function Graph() {
    ///Calculate weights for a (Song * Edge list) array.
    ///Create a graph (represented as a Song * Edge list array) from  a Song list.
    function buildGraph (lst: [Song, Edge[]][], numberOfEdges:Number) {
        ///Calculate the weight from a given Key to another Key.
        function weightForKey (key, other) {
            var accountFor12 = (n:number) => n % 12 == 0 ? 12 : n % 12;
            var k = key[0];
            var plusOne = accountFor12 (k + 1)            //One key up
            var minusOne = accountFor12 (k + 11)          //One key down.
            var oneSemitone = accountFor12 (k + 2)        //One semitone up.
            var twoSemitones = accountFor12 (k + 7)       //two semitones up.
            var threeUpDown = () => {
                switch (other[1]) {                        //If Chord.Minor, three keys UP, if Chord.Major three keys DOWN.
                    case Chord.Chord.Minor: return accountFor12 (k + 3);
                    case Chord.Chord.Major: return accountFor12 (k + 9);
                    default:          return Number.MAX_VALUE;
                }
            }

            //Create a list of all good key transitions.
            var lst = [ plusOne, minusOne, oneSemitone, twoSemitones, threeUpDown() ]
            //See if other key matches any of the good key transitions.
            let filtered = lst.filter (x => other[0] == x)
            //If there were any matches, then it's a nice key transition.
            return filtered.IsEmpty ? BADKEYWEIGHT : 0.0
        }

        function calculateWeight (fromSong:Song, toSong:Song) : Edge {
            var bpmDifference = System.Math.Abs (fromSong.BPM - toSong.BPM)
            var keyWeight = weightForKey(fromSong.Key, toSong.Key)

            var weight = bpmDifference + keyWeight
            return { Weight: weight, From = fromSong, To = toSong }
        }

        function generateEdges (song:Song, songs:Song[]) {
            ///Take n elements from a given list until there are no more elements.
            function take (n:Number, list: []) {
                function takeAcc (n, list:[], acc:[]) : []{
                    if (list.length <= 0) { 
                        return acc;
                    } 
                    if (n > 0) { 
                        return takeAcc((n-1), xs, (acc.append(x))); 
                    } 
                    else { 
                        return acc; 
                    }
                }
                return takeAcc (n, list, []);
            }

            function findOtherSongs (array:Song[]) { 
                array.filter (s => (s != song));
            }
            var createEdgesFromSong = 
                (songs) => findOtherSongs(songs).map(s => calculateWeight(song, s)).sortBy(s => s.Weight).take(numberOfEdges);
            //    |> Array.map (fun s -> calculateWeight song s)
            //    |> Array.sortBy (fun s -> s.Weight)
            //    |> List.ofArray
            //    |> take numberOfEdges

            let result = createEdgesFromSong(songs);
            return [song, result];
        }

        var withEdges = list.map (song => generateEdges(song, list));
        return withEdges;
    }

    ///Create a Map<audioId:string, (Song * Edge list)> from a Song * Edge list array.
    function asMap(graph) {
        let mapped = Array.Parallel.map (fun x -> ((fst x).AudioId, x)) graph
        Map.ofArray mapped
    }
}