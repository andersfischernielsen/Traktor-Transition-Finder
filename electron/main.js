var app = require('app'); 
var BrowserWindow = require('browser-window'); 
var request = require('request'); 
var ipc = require('ipc');

// Report crashes to our server.
require('crash-reporter').start();

var mainWindow = null;

var req = request.post('http://localhost:8083/collection',
    { body: '/collection.nml' },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
);

app.on('ready', function() {
  	mainWindow = new BrowserWindow({width: 300, 'min-width': 300, height: 600});
  	mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

  	mainWindow.on('closed', function() {
		mainWindow = null;
  	});
});

ipc.on('collection-upload', function () {

});