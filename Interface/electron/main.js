const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const dialog = electron.dialog;

const crypto = require('crypto');
const fs = require('fs');
const request = require('request');
const {exec} = require('child_process');
const configuration = require('./configuration');

let mainWindow;
let preferencesWindow;
let collectionPath;
let graph;


app.on('ready', function() {
	if (process.platform === 'darwin') {
        graph = exec(process.resourcesPath + '/app/Release/Traktor', { cwd: undefined, env: '/usr/local/bin' }, function (error, stdout, stderr) {
    		dialog.showErrorBox('Error', error.message);
    	});
    }

  	mainWindow = new BrowserWindow({'min-width': 350, width: 400, height: 600, resizable: true});
  	mainWindow.loadURL('file://' + __dirname + '/app/view/index.html');

	function checkIfSettingsPresent() {
		var collectionPath = configuration.readSettings('collectionPath');
		if (collectionPath) {
			mainWindow.webContents.on('did-finish-load', function() {
				sendCollectionRequest(collectionPath);
			})
		}
	}

	checkIfSettingsPresent();

    mainWindow.webContents.openDevTools();

  	mainWindow.on('closed', function() {
		if (preferencesWindow != null) {
			preferencesWindow.close();
		}
		preferencesWindow = null;
		mainWindow = null;
  	});
});

app.on('quit', function() {
	graph.kill('SIGKILL');
});

app.on('window-all-closed', function() {
	app.quit();
});

ipc.on('collection-upload', function (event, path) {
	sendCollectionRequest(path);
	collectionPath = path;
});

function sendCollectionRequest(path) {
	var edges = configuration.readSettings('numberOfEdges');
	var responseBody = null;
	if (typeof edges != 'undefined') {
		responseBody = { collectionPath: path, numberOfEdges: edges};
	}
	else {
		responseBody = { collectionPath : path };
	}

	mainWindow.webContents.send('parsing-started');

	request.post({
	  	headers: {'content-type' : 'application/x-www-form-urlencoded'},
	  	url:     'http://localhost:8083/collection',
	  	body:    JSON.stringify(responseBody)
	}, function(error, response, body) {
		if (error != null) {
    		dialog.showErrorBox('F# Server Error', error.message);
		}

		else {
			if (response.statusCode != 200) {
				console.log("Error: response was: " + response.statusCode);
				mainWindow.loadUrl('file://' + __dirname + '/app/view/index.html');
			}

			else {
				mainWindow.webContents.send('collection-uploaded');
			}
		}
	});
}

function createHash(s) {
    var sha256 = crypto.createHash("sha256");
    sha256.update(s, "utf8");
    return sha256.digest("base64");
}

ipc.on('song-drop', function (event, fileName, hash) {
	if (fileName) hash = createHash(fileName);
	var transitions = configuration.readSettings('transitions');
	if (typeof transitions === 'undefined') transitions = 8;

	var url = 'http://localhost:8083/choose/' + transitions + '/' + hash;
	request.get({
	  	url:     url,
	}, function(error, response, body) {
		if (error != null) {
			dialog.showErrorBox('F# Server Error', error.message);
		}

		else {
			event.sender.send('receive-transitions', body);
		}
	});
});

ipc.on('preferences', function (event, arg) {
	if (preferencesWindow) return;

	preferencesWindow = new BrowserWindow({width: 530, height: 270, resizable: false});
  	preferencesWindow.loadURL('file://' + __dirname + '/app/view/preferences.html');
    preferencesWindow.webContents.openDevTools();

	preferencesWindow.on('closed', function() {
		preferencesWindow = null;
	})
});

ipc.on('collection-path-request', function (event) {
	if (collectionPath) event.sender.send('receive-collection-path', collectionPath);
});
