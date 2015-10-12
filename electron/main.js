var app = require('app'); 
var BrowserWindow = require('browser-window'); 
var request = require('request'); 
var ipc = require('ipc');

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
    var request = require('request');
	request.post({
	  	headers: {'content-type' : 'application/x-www-form-urlencoded'},
	  	url:     'http://localhost:8083/collection',
	  	body:    arg
	}, function(error, response, body) {
		if (error) {
			console.log(error);
		}
		
		if (response.statusCode != 200) {
			console.log("Error: response was: " + response.statusCode);
			mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
		}
		
		mainWindow.loadUrl('file://' + __dirname + '/app/song-select.html');
	});
});