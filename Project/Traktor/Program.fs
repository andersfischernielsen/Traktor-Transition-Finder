open System.Xml.Linq
open FSharp.Data
open System.Collections.Generic


type Collection = XmlProvider<".\collection.nml">

type Song = { BPM : decimal; Title : string; Artist : string; Key : string }
type Edge = { Weight : int; From : Song; To : Song }

let parseCollection = 
    let parseToSong (i:Collection.Entry) = 
        let title = 
            match i.Title.IsSome with 
            | true -> i.Title.Value
            | _    -> ""
            
        let tempo = 
            match i.Tempo with
            | Some n -> n.Bpm
            | None   -> new decimal()

        let artist = 
            match i.Artist with
            | Some n -> n
            | None   -> ""

        let key = 
            match i.Info.Key with
            | Some n -> n
            | _      -> ""

        { BPM = tempo; Title = title; Artist = artist; Key = key }

    let sample = Collection.GetSample()
    let entries = sample.Collection.Entries2
    let songs = Array.map (fun i -> parseToSong i) entries
    List.ofArray songs

let rec createGraph (original: Song list) (list:Song list) acc = 
    match list with
    | song::ss  -> let otherSongs = List.filter (fun s -> (s <> song)) original
                   let edgesFromSong = List.map (fun s -> { Weight = System.Int32.MaxValue; From = song; To = s }) otherSongs
                   createGraph original ss ((song, edgesFromSong) :: acc)
    | []      -> acc

let rec calculateWeights list acc = 
    let calculateWeight edge = 
        let bpmWeight = System.Math.Abs (edge.From.BPM - edge.To.BPM)
        let keyWeight = 
            match (edge.From.Key, edge.To.Key) with
            | ("1d", "1m")      -> 0            //TODO: Define key rules.
            | ("1d", "2d")      -> 0
            | ("1d", "12d")     -> 0
            | ("1d", "2m")      -> 10
            | _                 -> 10000

        (int) bpmWeight + keyWeight

    let weightForSongEdgeTuple (song, edges) = 
        (song, List.map (fun e -> { Weight = calculateWeight e; From = e.From; To = e.To }) edges)

    match list with 
    | x::xs -> calculateWeights xs ((weightForSongEdgeTuple x) :: acc)
    | []     -> acc


[<EntryPoint>]
let main argv = 
    let songs = parseCollection
    let graph = createGraph songs songs []
    let withWeights = calculateWeights graph []
    
    0
