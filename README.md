# TraktorAutoNextSong
A small tool for automatically finding the next song to play when DJing using Traktor Pro 2.

The tool works by creating a weighted graph of every song in a Traktor collection of songs, where the weights determine what song is best to mix into. 
The weight is calculated using the BPM of the songs and their different keys. 

The tool is written in F# and Node.js/Electron. The backend is written in F#, and acts as a small web server receiving graph/song requests. 
The frontend is written in Node.js/Electron and sends requests to the F# web server.

When a song is dropped into the app, the best transitions from that song are displayed. 
The DJ can then pick a song from the list in Traktor Pro 2. The appmerely functions as a suggestion list.

![Screenshot](/screenshot.png) 