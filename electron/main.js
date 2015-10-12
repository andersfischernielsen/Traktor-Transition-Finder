var app = require('app'); 
var BrowserWindow = require('browser-window'); 
var request = require('request'); 
var ipc = require('ipc');
var crypto = require('crypto');
var request = require('request');


// Report crashes to our server.
require('crash-reporter').start();

var collection;

var mainWindow = null;
var collection_path = ""

app.on('ready', function() {
  	mainWindow = new BrowserWindow({width: 300, 'min-width': 300, height: 600});
  	mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

  	mainWindow.on('closed', function() {
		  mainWindow = null;
  	});
});

ipc.on('collection-upload', function (event, arg) {
	collection_path = arg;
	request.post({
	  	headers: {'content-type' : 'application/x-www-form-urlencoded'},
	  	url:     'http://localhost:8083/collection',
	  	body:    arg
	}, function(error, response, body) {
		if (error != null) {
			console.log(error);
		}
		
		else {
			if (response.statusCode != 200) {
				console.log("Error: response was: " + response.statusCode);
				mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
			}	
			
			mainWindow.loadUrl('file://' + __dirname + '/app/song-select.html');
		}
	});
});

function createHash(s) {
    var sha256 = crypto.createHash("sha256");
    sha256.update(s, "utf8");
    return sha256.digest("base64");
}

ipc.on('song-drop', function (event, arg) {
	var hash = createHash(arg);
	console.log(hash);
});