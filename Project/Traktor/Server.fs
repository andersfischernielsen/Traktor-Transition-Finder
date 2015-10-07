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

///Convert a byte array into a string.
let byteArrayAsString s = System.Text.Encoding.ASCII.GetString(s)

///Convert a given object into JSON.
let asJson v = 
    let jsonSerializerSettings = new JsonSerializerSettings()
    jsonSerializerSettings.ContractResolver <- new CamelCasePropertyNamesContractResolver()

    JsonConvert.SerializeObject(v, jsonSerializerSettings) |> OK >>= Writers.setMimeType "application/json; charset=utf-8"

//Mutable graph of songs.
let mutable graph = []

//Search using the current graph.
let search s = Search.search s graph |> List.map (fun x -> String.Format("{0} by {1}", (fst x).Title, (fst x).Artist))


///Set a new path to the collection from an incoming HTTP POST. Graph will be rebuilt.
let setCollectionString s = 
    let asString = byteArrayAsString s
    graph <- CollectionParser.parseCollection asString |> Graph.buildGraph 


//Setup web server.
let app =
  choose
    [ GET >>= choose
        [ path "/" >>= OK "Web server is running."
          pathScan "/search/%s" (fun (searchTerm) -> search searchTerm |> asJson)
        ]
      POST >>= choose
        [ path "/collection" >>= request (fun req -> setCollectionString <| req.rawForm; 
                                                     OK "Collection path changed.") 
        ]
    ]

startWebServer defaultConfig app