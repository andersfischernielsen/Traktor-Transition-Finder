open System.Xml.Linq
open FSharp.Data
open System.Collections.Generic
open System


type Collection = XmlProvider<".\collection.nml">

type Chord = Major | Minor | None
type Song = { BPM : decimal; Title : string; Artist : string; Key : (int * Chord) }
type Edge = { Weight : double; From : Song; To : Song }

let parseCollection = 
    let parseKey (s:string) = 
        let key = match s.[1] with
                  | 'd' -> Major
                  | 'm' -> Minor
                  | _   -> None
        let number = Int32.Parse <| s.[0].ToString()
        (number, key)

    let parseToSong (i:Collection.Entry) = 
        let title = i.Title
        let tempo = i.Tempo.Bpm
        let artist = i.Artist
        let key = parseKey i.Info.Key

        { BPM = tempo; Title = title; Artist = artist; Key = key }

    let sample = Collection.GetSample()
    let entries = sample.Collection.Entries2
    let songs = Array.map (fun i -> parseToSong i) entries
    List.ofArray songs

let rec createGraph (original: Song list) (list:Song list) acc = 
    match list with
    | song::ss  -> let otherSongs = List.filter (fun s -> (s <> song)) original
                   let edgesFromSong = List.map (fun s -> { Weight = System.Double.MaxValue; From = song; To = s }) otherSongs
                   createGraph original ss ((song, edgesFromSong) :: acc)
    | []      -> acc

let weightForKey (key : int * Chord) (other : int * Chord) : int = 
    match key with                                               //TODO: Define key rules and add more key rules.
    | (n, Major) -> match other with
                    | (1, Minor) | (2, Major) | (12, Major) -> 0 //Major to minor, one key up/down.
                    | (3, Major) | (8, Major)               -> 0 //One semitone, two semitones up.
                    | (10, Major)                           -> 0 //Since major, three keys down.
                    | _                                     -> 20 //Keys do not match up, add 20 to weight.
    | (n, Minor) -> match other with
                    | (1, Major) | (2, Minor) | (12, Minor) -> 0 //Major to minor, one key up/down.
                    | (3, Minor) | (8, Minor)               -> 0 //One semitone, two semitones up.
                    | (4, Minor)                            -> 0 //Since minor, three keys UP.
                    | _                                     -> 20 //Keys do not match up, add 20 to weight.
   
    | _                                                     -> 10000

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
    
    0
