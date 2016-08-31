var ipcPreferences = require('electron').ipcRenderer;
var configuration = require('electron').remote.require('./configuration');

var field = <HTMLInputElement>document.getElementById('collection-path-field');
var checkBox = document.getElementById('cacheCheck');
var edgesField = <HTMLInputElement>document.getElementById('graph-edges-field');
var transitionsField = <HTMLInputElement>document.getElementById('transition-number-field');

function setBodyDrag() {
	var body = document.getElementsByTagName('body')[0];

	//Make the main window ignore drag-n-drop.
	body.addEventListener('dragover', e => {
		e.stopPropagation();
		e.preventDefault();
	});

	body.addEventListener('dragleave', e => {
		e.stopPropagation();
		e.preventDefault();
	});

	body.addEventListener('drop', e => {
		e.stopPropagation();
		e.preventDefault();
	});
}

function requestCurrentCollectionPath() {
	ipcPreferences.send('collection-path-request');
}

ipcPreferences.on('receive-collection-path', (event, path) => {
	field.value = path;
});

function retrieveSettings() {
	var path = configuration.readSettings('collectionPath');
	var transitions = configuration.readSettings('transitions');
	var edges = configuration.readSettings('numberOfEdges');
	//var cached = configuration.readSettings('cached');

	if (path) field.value = path;
	if (typeof transitions != 'undefined') transitionsField.value = transitions;
	if (typeof edges != 'undefined') edgesField.value = edges;
	//if (typeof cached != 'undefined') checkBox.checked = cached;
}

window.onbeforeunload =
	() => {
		configuration.saveSettings('collectionPath', field.value);
		configuration.saveSettings('transitions', transitionsField.value);
		configuration.saveSettings('numberOfEdges', edgesField.value);
		//configuration.saveSettings('cached', checkBox.checked);
	};

setBodyDrag();
retrieveSettings();
