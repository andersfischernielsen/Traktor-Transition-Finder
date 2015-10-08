var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var request = require('request'); //Module for requests.


// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  	// Create the browser window.
  	mainWindow = new BrowserWindow({width: 800, height: 600});

	request.post('http://localhost:8083/collection',
	    { body: '/collection.nml' },
	    function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            console.log(body)
	        }
	    }
	);

	  // and load the index.html of the app.
  	mainWindow.loadUrl('localhost:8083/search/justin');

	  // Open the DevTools.
  	mainWindow.openDevTools();

	  // Emitted when the window is closed.
  	mainWindow.on('closed', function() {
	    // Dereference the window object, usually you would store windows
	    // in an array if your app supports multi windows, this is the time
	    // when you should delete the corresponding element.
		mainWindow = null;
  	});
});