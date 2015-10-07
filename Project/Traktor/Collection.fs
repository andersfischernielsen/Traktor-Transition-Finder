module Collection

open System.Xml.Linq
open FSharp.Data
open System.Collections.Generic
open System


type Collection = XmlProvider<"collection.nml">

type Chord = Major | Minor | Invalid
type Song = { BPM : decimal; Title : string; Artist : string; Key : (int * Chord); AudioId : string }
type Edge = { Weight : double; From : Song; To : Song }

module CollectionParser = 
    open System.Text.RegularExpressions

    let parseCollection (pathToCollection : string) = 
        let regex = Regex @"\d+"

        //Function wrapping parsing from one data type to another using TryParse.
        let (|Success|Failure|) tryResult =
            match tryResult with
            | true, value -> Success value
            | _ -> Failure

        ///Parse string keys from KEY.INFO attribute in NML.
        let parseKey (s:string) = 
            let num = regex.Match s
            let key = if s.Contains("d") then Major else Minor

            let number = match Int32.TryParse num.Value with
                         | Success value -> value
                         | Failure -> 0
            (number, key)

        ///Parse integer key from MUSICAL_KEY attribute in NML to Key.
        let parseMusicalKey k = 
            match k with 
            | 0     -> (1, Major)
            | 1     -> (8, Major)
            | 2     -> (3, Major)
            | 3     -> (10, Major)
            | 4     -> (5, Major)
            | 5     -> (12, Major)
            | 6     -> (7, Major)
            | 7     -> (2, Major)
            | 8     -> (9, Major)
            | 9     -> (4, Major)
            | 10    -> (11, Major)
            | 11    -> (6, Major)
            | 12    -> (10,Minor)
            | 13    -> (5, Minor)
            | 14    -> (12, Minor)
            | 15    -> (7, Minor)
            | 16    -> (2, Minor)
            | 17    -> (9, Minor)
            | 18    -> (4, Minor)
            | 19    -> (11, Minor)
            | 20    -> (6, Minor)
            | 21    -> (1, Minor)
            | 22    -> (8, Minor)
            | 23    -> (3, Minor)
            | _     -> (0, Invalid)

        ///Unwrap a string option into either the value or "" if None.
        let unwrapString s = 
            match s with
            | Some e -> e
            | None   -> ""

        ///Parse a given NML Entry into a Song type.
        let parseToSong (i:Collection.Entry) = 
            match i.Tempo, i.Title.String, i.Artist, i.MusicalKey, i.Info.Key, i.AudioId with
            //Use the main MUSICAL_KEY attribute if possible.
            | Some te, Some ti, Some a, Some k, _, Some id      
                    -> { BPM = te.Bpm; Title = ti; Artist = a; Key = parseMusicalKey k.Value; AudioId = id }
            | Some te, _, Some a, Some k, _, Some id                   
                    -> { BPM = te.Bpm; Title = unwrapString i.Title.String; Artist = a; Key = parseMusicalKey k.Value; AudioId = id}
            | Some te, Some ti, _, Some k, _, Some id      
                    -> { BPM = te.Bpm; Title = ti; Artist = unwrapString i.Artist; Key = parseMusicalKey k.Value; AudioId = id}
            | Some te,  _, _, Some k, _, Some id           
                    -> { BPM = te.Bpm; Title = unwrapString i.Title.String; Artist = unwrapString i.Artist; Key = parseMusicalKey k.Value; AudioId = id}
            //If MUSICAL_KEY isn't available use INFO.KEY
            | Some te, Some ti, Some a, _, Some k, Some id 
                    -> { BPM = te.Bpm; Title = ti; Artist = a; Key = parseKey k; AudioId = id}
            | Some te, _, Some a, _, Some k, Some id       
                    -> { BPM = te.Bpm; Title = unwrapString i.Title.String; Artist = a; Key = parseKey k; AudioId = id}
            | Some te, Some ti, _, _, Some k, Some id      
                    -> { BPM = te.Bpm; Title = ti; Artist = unwrapString i.Artist; Key = parseKey k; AudioId = id}
            | Some te,  _, _, _, Some k, Some id           
                    -> { BPM = te.Bpm; Title = unwrapString i.Title.String; Artist = unwrapString i.Artist; Key = parseKey k; AudioId = id}
            //Invalid key info.
            | _, _, _, _, _, _  -> { BPM = new Decimal (0); Title = String.Empty; Artist = String.Empty; Key = (0, Invalid); AudioId = String.Empty}

        let collection = Collection.Load(pathToCollection)
        let entries = collection.Collection.Entries2
        let songs = Array.Parallel.map (fun i -> parseToSong i) entries
        List.ofArray songs


module Graph = 
    ///Create a graph (represented as a (Song * Edge list) list from  a Song list. 
    let buildGraph list = 
        let rec createGraphAcc (original: Song list) (list:Song list) acc = 
            match list with     //TODO: Implement as fold, then to parallel processing for performance.
            | song::ss  -> let otherSongs = List.filter (fun s -> (s <> song)) original
                           let edgesFromSong = List.map (fun s -> { Weight = System.Double.MaxValue; From = song; To = s }) otherSongs
                           createGraphAcc original ss ((song, edgesFromSong) :: acc)
            | []      -> acc
        
        createGraphAcc list list []

    ///Calculate the weight from a given Key to another Key.
    let weightForKey key other = 
        let accountFor12 n = if n % 12 = 0 then 12 else n % 12

        let k = fst key
        let plusOne = accountFor12 k + 1            //One key up
        let minusOne = accountFor12 k + 11          //One key down.
        let oneSemitone = accountFor12 k + 2        //One semitone up.
        let twoSemitones = accountFor12 k + 7       //two semitones up.
        let threeUpDown = match snd other with      //If minor, three keys UP, if major three keys DOWN.
                          | Minor -> accountFor12 k + 3 
                          | Major -> accountFor12 k + 9
                          | Invalid  -> Int32.MaxValue

        let list = [ plusOne; minusOne; oneSemitone; twoSemitones; threeUpDown ] //Create a list of all good key transitions.
        let filtered = List.filter (fun x -> fst other = x) list                 //See if other key matches any of the good key transitions.
        if filtered.IsEmpty then 20 else 0                                       //If there were any matches, then we're have a nice transition.

    ///Calculate weights for a (Song * Edge list) list
    let calculateWeights list =
        let rec calculateWeightsAcc list acc = 
            let calculateWeight edge = 
                let bpmWeight = System.Math.Abs (edge.From.BPM - edge.To.BPM)
                let keyWeight = weightForKey edge.From.Key edge.To.Key
                (double) bpmWeight + (double) keyWeight

            let weightForSongEdgeTuple (song, edges) = 
                (song, List.map (fun e -> { Weight = calculateWeight e; From = e.From; To = e.To }) edges)

            match list with 
            | x::xs -> calculateWeightsAcc xs ((weightForSongEdgeTuple x) :: acc) //TODO: List.fold instead of pattern matching.
            | []     -> acc
        
        calculateWeightsAcc list []


module Search = 
    open System.Globalization

    let search searchTerm graphWithWeights = 
        let titleContains s e = (fst e).Title.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0;
        let artistContains s e = (fst e).Artist.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0;

        List.filter (fun x -> titleContains searchTerm x || artistContains searchTerm x) graphWithWeights


module UI =
    let SimpleUI = 
        printfn "Please input path to collection.nml:"
        let path = Console.ReadLine()
        let songs = CollectionParser.parseCollection <| path.Trim()
        let graph = Graph.buildGraph songs |> Graph.calculateWeights
    
        let rec search list = 
            printfn "\nPlease input song title to search for:"
            let searchTitle = Console.ReadLine()
            let result = Search.search searchTitle graph
            if result.IsEmpty then search [] else result

        let result = search []

        printfn "\nPlease choose a song (type number):"
        let i = ref 0
        List.iter (fun x -> printfn "%A: %A by %A" !i (fst x).Title (fst x).Artist; i := !i+1) result
        let index = Int32.Parse <| Console.ReadLine()
        let choice = List.nth result index 

        let goodTransitions = List.sortBy (fun x -> x.Weight) (snd choice)
    
        printfn "\nFrom"
        let chosen = fst choice
        printfn "-------\n%A %A\n%A by %A\n-------" chosen.BPM chosen.Key chosen.Title chosen.Artist

        printfn "\nGood transitions would be:"
        let i = ref 0
        List.iter (fun x -> 
            if (!i < 8) 
            then printfn "-------\n%A %A\n%A by %A" x.To.BPM x.To.Key x.To.Title x.To.Artist; i := !i+1 ) goodTransitions

