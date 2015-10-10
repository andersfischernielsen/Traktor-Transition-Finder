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

//Suave data types.
type SuaveTask<'a> = Async<'a option>
type WebPart = HttpContext -> SuaveTask<HttpContext>

///JSON data type
type SongResponse = { Song : Song; Transitions : Song list }

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
let fromJson v = 
    let jsonSerializerSettings = new JsonSerializerSettings()
    jsonSerializerSettings.ContractResolver <- new CamelCasePropertyNamesContractResolver()
    JsonConvert.DeserializeObject(v, jsonSerializerSettings)

//Mutable graph of songs.
let mutable graph = []



///Set a new path to the collection from an incoming HTTP POST. Graph will be rebuilt.
let setCollectionString s = 
    let asString = System.Text.Encoding.ASCII.GetString(s)
    let built = Graph.buildGraph <| CollectionParser.parseCollection asString
    let withWeights = Graph.calculateWeights built
    graph <- withWeights
   
///Find a given (Song * Edge list) tuple with the given AudioId.
let getById id graph = List.find (fun x -> (fst x).AudioId = id) graph

///Get the n best transitions from a given (Song * Edge list) tuple.
let bestTransitions n edges = 
    edges |> List.sortBy (fun x -> x.Weight) 
          |> take n 
          |> List.map (fun x -> x.To)

///Search for a song using the current graph. Returns the result as a JSON HttpContext option.
let searchAndReturnAsJsonString searchTerm = 
    let search s = Search.search s graph |> List.map (fun x -> fst x)
    search searchTerm |> asJson

let getFiveBestTransitionsFromId id = 
    let tuple = getById id graph
    let transitions = bestTransitions 5 <| snd tuple
    let response = { Song = fst tuple; Transitions = transitions }
    response |> asJson

///Setup web server.
let app =
  choose
    [ GET >>= choose
        [ path "/" >>= OK "Web server is running."
          pathScan "/search/%s" (fun searchTerm -> searchAndReturnAsJsonString searchTerm)
        ]
      POST >>= choose
        [ path "/collection" >>= request (fun req -> setCollectionString <| req.rawForm; 
                                                     OK "Collection path succesfully set.") 
          pathScan "/choose/%s" (fun id -> getFiveBestTransitionsFromId id)
        ]
    ]

startWebServer defaultConfig app