import electron = require('electron');
import * as graph from "./graph";

var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipc = electron.ipcMain;
var dialog = electron.dialog;

var crypto = require('crypto');
var fs = require('fs');
var request = require('request');
var {exec} = require('child_process');
var configuration = require('./configuration');

let mainWindow;
let preferencesWindow;
let collectionPath;
let builtGraph : Map<string, [graph.Song, graph.Edge[]]>;

app.on('ready', () => {
	setAppEvents();
	setIpcEvents();
	setUpMainWindow(false);

	var collectionPath = configuration.readSettings('collectionPath');
	if (collectionPath) {
		mainWindow.webContents.on('did-finish-load', () => buildGraph(collectionPath))
	}
});

function setAppEvents() {
	app.on('window-all-closed', () => app.quit());
}

function setIpcEvents() {
	ipc.on('song-drop', (event, fileName) => chooseSong(event, fileName));
	ipc.on('preferences', (event, arg) => spawnPreferences())
	ipc.on('collection-path-request', (event) => {
		if (collectionPath) event.sender.send('receive-collection-path', collectionPath);
	});
	ipc.on('collection-upload', (event, path) => {
		buildGraph(path);
		collectionPath = path;
	});
}

function setUpMainWindow(devTools = false) {
	mainWindow = new BrowserWindow({ minWidth: 350, width: 400, height: 600, resizable: true });
	mainWindow.loadURL('file://' + __dirname + '/app/view/index.html');

	mainWindow.on('closed', () => {
		if (preferencesWindow != null) {
			preferencesWindow.close();
		}
		preferencesWindow = null;
		mainWindow = null;
	});

	if (devTools) mainWindow.webContents.openDevTools();
}

function buildGraph(path) {
	var edges = configuration.readSettings('numberOfEdges');
	var request = { collectionPath: path, numberOfEdges: edges };
	
	mainWindow.webContents.send('parsing-started');
	var parsed = graph.CollectionParser.parseCollection('/Users/Anders/Documents/Native Instruments/Traktor 2.10.2/collection.nml');
	var result = graph.Graph.buildGraph(parsed, 5);
	builtGraph = graph.Graph.asMap(result);
	mainWindow.webContents.send('collection-uploaded');
}

function chooseSong(event, fileName) {
	var numberOfTransitions = configuration.readSettings('transitions');
	if (typeof numberOfTransitions === 'undefined') numberOfTransitions = 8;

	var transitions = builtGraph.get(fileName);
	event.sender.send('receive-transitions', transitions);
}

function spawnPreferences() {
	if (preferencesWindow) return;

	preferencesWindow = new BrowserWindow({ width: 530, height: 270, resizable: false });
	preferencesWindow.loadURL('file://' + __dirname + '/app/view/preferences.html');
	//preferencesWindow.webContents.openDevTools();

	preferencesWindow.on('closed', () => preferencesWindow = null)
}
