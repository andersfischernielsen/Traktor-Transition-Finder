# TraktorAutoNextSong
A small tool for automatically finding the next song to play when DJing using Traktor Pro 2.

The tool works by creating a weighted graph of every song in a Traktor collection of songs, where the weights determine what song is best to mix into. 
The weight is calculated using the BPM of the songs and their different keys. 

The tool is written in F# and Node.js/Electron. The backend is written in F#, and acts as a small web server receiving graph/song requests. 
The frontend is written in Node.js/Electron and sends requests to the F# web server.

When a song is dropped into the app, the best transitions from that song are displayed. 
The DJ can then pick a song from the list in Traktor Pro 2. The app merely functions as a suggestion list.

## Building
The app consists of a F# backend handling parsing the Traktor 2 collection, and serving results via HTTP and JSON to the Electron frontend. 

You can build the app by opening the solution in Visual Studio on Windows og by running

    xbuild /p:Configuration=Release Project/TraktorAutoNextSong.sln

in your Terminal on linux and OS X.

## Running
The F# backend is started by running 

    mono Project/Traktor/bin/Release/Traktor.exe

in your Terminal on linux and OS X. 

The frontend is started by running

    /Applications/Electron.app/Contents/MacOS/Electron electron

in your Terminal on OS X, 

    PATH-TO-ELECTRON\electron\electron.exe electron 

on Windows, or 

    PATH-TO-ELECTRON/electron/electron electron

on linux.


# Screenshot

![Screenshot](/screenshot.png) 