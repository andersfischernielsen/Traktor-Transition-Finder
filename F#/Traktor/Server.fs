module Server

open System
open Suave
open Suave.Http
open Suave.Http.Applicatives
open Suave.Http.Successful
open Suave.Web
open Suave.Types
open Suave.Json
open Collection
open Newtonsoft.Json
open Newtonsoft.Json.Serialization
open System.Collections.Generic

//Suave data types.
type SuaveTask<'a> = Async<'a option>
type WebPart = HttpContext -> SuaveTask<HttpContext>

///JSON data type
type SongResponse = { Song : Song; Transitions : Song list }
type ParsingOptions = { CollectionPath : string; NumberOfEdges : int}

///Take n elements from a given list until there are no more elements.
let take n list =
    let rec takeAcc n list acc =
        match list with
        | x::xs     when n > 0 -> takeAcc (n-1) xs (x::acc)
        | _                    -> acc
    takeAcc n list []

///Convert a given object into JSON.
let asJson v =
    let jsonSerializerSettings = new JsonSerializerSettings()
    jsonSerializerSettings.ContractResolver <- new CamelCasePropertyNamesContractResolver()
    JsonConvert.SerializeObject(v, jsonSerializerSettings) |> OK >>= Writers.setMimeType "application/json; charset=utf-8"

///Deserialise a given object from JSON.
let fromJson<'T> v =
    let jsonSerializerSettings = new JsonSerializerSettings()
    jsonSerializerSettings.ContractResolver <- new CamelCasePropertyNamesContractResolver()
    JsonConvert.DeserializeObject<'T>(v, jsonSerializerSettings)

//Mutable graph of songs.
let mutable graph = Map.empty



///Set a new path to the collection from an incoming HTTP POST. Graph will be rebuilt.
let parseCollection options =
    let path = options.CollectionPath
    let edges = options.NumberOfEdges

    let parsed = CollectionParser.parseCollection path
    let built = Graph.buildGraph parsed edges
    graph <- Graph.asMap built

///Find a given (Song * Edge list) tuple with the given AudioId.
let getById id = Map.find id

///Get the n best transitions from a given (Song * Edge list) tuple.
let bestTransitions n edges =
    List.ofArray edges
        |> take n
        |> List.map (fun x -> x.To)

let getBestTransitionsFromId id amount =
    let tuple = getById id graph
    let transitions = bestTransitions amount <| snd tuple
    let response = { Song = fst tuple; Transitions = transitions }
    response |> asJson


let parseCollectionFromBytes bytes =
    let options =
        let asString = System.Text.Encoding.ASCII.GetString(bytes)
        fromJson<ParsingOptions> asString
    parseCollection options

///Setup web server.
let app =
  choose
    [ GET >>= choose
        [ path "/" >>= OK "Web server is running."
          pathScan "/choose/%i/%s" (fun (amt, id) -> getBestTransitionsFromId id amt)
        ]
      POST >>= choose
        [ path "/collection" >>= request (fun req -> parseCollectionFromBytes req.rawForm;
                                                     OK "Graph building started.")
        ]
    ]

//let options = fromJson req.url; parseCollection <| options; OK "Graph building started.")

startWebServer defaultConfig app
