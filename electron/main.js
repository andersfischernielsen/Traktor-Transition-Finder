var app = require('app'); 
var BrowserWindow = require('browser-window'); 
var request = require('request'); 
var ipc = require('ipc');

// Report crashes to our server.
require('crash-reporter').start();

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
    console.log(collection_path);
    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
});