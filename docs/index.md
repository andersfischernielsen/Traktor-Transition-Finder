***

<p align="center"><b>Traktor Transition Finder</b> - a small tool for automatically finding the next song to play when DJing using Traktor</p>

***

![Screenshot](readme/readme.png) 


<span class="badge-paypal"><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=GFDKRJ7LCQFQS" title="Donate to this project using Paypal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a> if you think this project is awesome. </span>

When a song is dropped into the app the best transitions from that song are displayed. The DJ can then pick a song from the list in Traktor.

The tool creates a weighted digraph of every song in a Traktor collection of songs, where the weights determine what song is best to mix into from the current song. The weight is calculated using the BPM of the songs and their different keys. 

<p align="center"><a href="https://github.com/andersfischernielsen/Traktor-Transition-Finder/releases/latest">Download</a></p>



## How to Use
- Open the app and select `File` -> `Open Collection...` and select your Traktor collection. 
- Let the app analyse the collection and the available transitions.
- Drag a file from the song list in Traktor or from Finder into the app to get a list of possible transitions from the song.
- Double-click transitions in the transition list to explore continuous transitions.
- Double-click transition in the transition history to jump back to a previous song.

