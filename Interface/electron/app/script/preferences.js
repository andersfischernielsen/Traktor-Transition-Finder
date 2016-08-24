'use strict';

var ipc = require('electron').ipcRenderer;
var configuration = require('electron').remote.require('./configuration');

var field = document.getElementById('collection-path-field');
var checkBox = document.getElementById('cacheCheck');
var edgesField = document.getElementById('graph-edges-field');
var transitionsField = document.getElementById('transition-number-field');

function setBodyDrag() {
	var body = document.getElementsByTagName('body')[0];

	//Make the main window ignore drag-n-drop.
	body.addEventListener('dragover', function(e) {
	    e.stopPropagation();
	    e.preventDefault();
	});

	body.addEventListener('dragleave', function(e) {
	    e.stopPropagation();
	    e.preventDefault();
	});

	body.addEventListener('drop', function(e) {
	    e.stopPropagation();
	    e.preventDefault();
	});
}

function requestCurrentCollectionPath() {
	ipc.send('collection-path-request');
}

ipc.on('receive-collection-path', function(event, path) {
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

window.onbeforeunload = function() {
	configuration.saveSettings('collectionPath', field.value);
	configuration.saveSettings('transitions', transitionsField.value);
	configuration.saveSettings('numberOfEdges', edgesField.value);
	//configuration.saveSettings('cached', checkBox.checked);
};

setBodyDrag();
retrieveSettings();
