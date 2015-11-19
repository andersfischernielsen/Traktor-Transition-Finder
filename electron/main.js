var app = require('app');
var BrowserWindow = require('browser-window');
var request = require('request');
var ipc = require('electron').ipcMain;
var crypto = require('crypto');
var fs = require('fs');
var request = require('request');
var dialog = require('dialog');
var exec = require('child_process').exec;

var mainWindow = null;
var preferencesWindow = null;
var settings = { };
var path = app.getPath('userData');


app.on('ready', function() {
	if (process.platform === 'darwin') {
        graph = exec('mono ' + process.resourcesPath + '/Release/Traktor.exe', { cwd: undefined, env: '/usr/local/bin' }, function (error, stdout, stderr) {
    		dialog.showErrorBox('Error', error.message);
    	});
    }

    //For future Windows support.
    //if (process.platform === 'win32') {
    //	graph = exec(process.resourcesPath + '/Release/Traktor.exe', null, null);
    //}

  	mainWindow = new BrowserWindow({'min-width': 350, width: 400, height: 600, resizable: true});
  	mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    //mainWindow.webContents.openDevTools();

  	mainWindow.on('closed', function() {
		  mainWindow = null;
  	});

	ReadSettings();	
});

function ReadSettings() {
	fs.readFile(path + '/settings.json', 'utf8', function(error, data) {
		debugger;
		if (!error) {
			this.settings = JSON.parse(data);
			if (this.settings.collectionPath) {
    			//TODO: Load view for dropping song. 
			}
		}
	});
}

app.on('quit', function() {
	graph.kill('SIGKILL');
});

app.on('window-all-closed', function() {
	app.quit();
});

ipc.on('collection-upload', function (event, arg) {
	this.settings.collectionPath = arg;
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

			else {
				event.sender.send('collection-uploaded');
			}
		}
	});
});

function createHash(s) {
    var sha256 = crypto.createHash("sha256");
    sha256.update(s, "utf8");
    return sha256.digest("base64");
}

ipc.on('song-drop', function (event, fileName, hash) {
	var hash;
	if (fileName) {
		hash = createHash(fileName);
	}
	if (hash) {
		hash = hash;
	}

	request.get({
	  	url:     'http://localhost:8083/choose/' + hash,
	}, function(error, response, body) {
		if (error != null) {
			console.log(error);
		}

		else {
			event.sender.send('receive-transitions', body);
		}
	});
});

ipc.on('preferences', function (event, arg) {
	preferencesWindow = new BrowserWindow({width: 500, height: 400, resizable: true});
  	preferencesWindow.loadURL('file://' + __dirname + '/app/preferences.html');
    //preferencesWindow.webContents.openDevTools();	
});

ipc.on('collection-path-request', function (event) {
	event.sender.send('receive-collection-path', this.settings.collectionPath);
});

ipc.on('close-preferences', function (event, settings) {
	this.settings = settings;
	var asJSON = JSON.stringify(this.settings);
	fs.writeFile(path + '/settings.json', asJSON, 'utf8');
});

ipc.on('request-settings', function(event) {
	event.sender.send('receive-settings', this.settings);
});
