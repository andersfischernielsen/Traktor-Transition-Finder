open System.Xml.Linq
open FSharp.Data
open System.Collections.Generic
open System
open System.Text.RegularExpressions


type Collection = XmlProvider<".\collection.nml">

type Chord = Major | Minor | Invalid
type Song = { BPM : decimal; Title : string; Artist : string; Key : (int * Chord) }
type Edge = { Weight : double; From : Song; To : Song }


let parseCollection = 
    let regex = Regex @"\d+"

    let (|Success|Failure|) tryResult =
        match tryResult with
        | true, value -> Success value
        | _ -> Failure

    let parseKey (s:string) = 
        let num = regex.Match s
        let key = if s.Contains("d") then Major else Minor

        let number = match Int32.TryParse num.Value with
                     | Success value -> value
                     | Failure -> 0
        (number, key)

    let unwrapString s = 
        match s with
        | Some e -> e
        | None   -> ""

    let parseToSong (i:Collection.Entry) = 
        match i.Tempo, i.Title.String, i.Artist, i.Info.Key with
        | Some te, Some ti, Some a, Some k    -> { BPM = te.Bpm; Title = ti; Artist = a; Key = parseKey k }
        | Some te, _, Some a, Some k          -> { BPM = te.Bpm; Title = unwrapString i.Title.String; Artist = a; Key = parseKey k}
        | Some te, Some ti, _, Some k         -> { BPM = te.Bpm; Title = ti; Artist = unwrapString i.Artist; Key = parseKey k}
        | _, _, _, _                          -> { BPM = new Decimal (0); Title = String.Empty; Artist = String.Empty; Key = (0, Invalid)}

    let collection = Collection.Load("..\..\collection.nml")
    let entries = collection.Collection.Entries2
    let songs = Array.map (fun i -> parseToSong i) entries
    List.ofArray songs

let rec createGraph (original: Song list) (list:Song list) acc = 
    match list with
    | song::ss  -> let otherSongs = List.filter (fun s -> (s <> song)) original
                   let edgesFromSong = List.map (fun s -> { Weight = System.Double.MaxValue; From = song; To = s }) otherSongs
                   createGraph original ss ((song, edgesFromSong) :: acc)
    | []      -> acc



let weightForKey (key : int * Chord) (other : int * Chord) : int = 
    let accountFor12 n = if n % 12 = 0 then 12 else n % 12

    let k = fst key
    let plusOne = accountFor12 k + 1             //One key up
    let minusOne = accountFor12 k + 11           //One key down.
    let oneSemitone = accountFor12 k + 2         //One semitone up.
    let twoSemitones = accountFor12 k + 7        //two semitones up.
    let threeUpDown = match snd other with              //If minor, three keys UP, if major three keys DOWN.
                      | Minor -> accountFor12 k + 3 
                      | Major -> accountFor12 k + 9
                      | Invalid  -> Int32.MaxValue

    let list = [ plusOne; minusOne; oneSemitone; twoSemitones; threeUpDown ] //Create a list of all good key transitions.
    let filtered = List.filter (fun x -> fst other = x) list                 //See if other key matches any of the good key transitions.
    if filtered.IsEmpty then 20 else 0                                       //If there were any matches, then we're have a nice transition.


let rec calculateWeights list acc = 
    let calculateWeight edge = 
        let bpmWeight = System.Math.Abs (edge.From.BPM - edge.To.BPM)
        let keyWeight = weightForKey edge.From.Key edge.To.Key
        (double) bpmWeight + (double) keyWeight

    let weightForSongEdgeTuple (song, edges) = 
        (song, List.map (fun e -> { Weight = calculateWeight e; From = e.From; To = e.To }) edges)

    match list with 
    | x::xs -> calculateWeights xs ((weightForSongEdgeTuple x) :: acc) //TODO: List.fold instead of pattern matching.
    | []     -> acc



[<EntryPoint>]
let main argv = 
    let songs = parseCollection
    let graph = createGraph songs songs []
    let withWeights = calculateWeights graph []
    
    let justinResults = List.filter (fun x -> (fst x).Artist.Contains("Justin")) withWeights
    let justin = justinResults.Head
    let goodTransitions = List.sortBy (fun x -> x.Weight) (snd justin)

    0
