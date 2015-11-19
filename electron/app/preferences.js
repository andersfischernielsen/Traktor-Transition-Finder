'use strict';

var ipc = require('electron').ipcRenderer;

var field = document.getElementById('collection-path-field');
var checkBox = document.getElementById('cacheCheck');

var settings = { };

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

ipc.on('receive-settings', function(event, settings) {
	settings = settings;
	field.value = settings.collectionPath;
	checkBox.value = settings.cached;
})

function RequestCurrentCollectionPath() {
	ipc.send('collection-path-request');
}

function CheckCached() {
	settings.cached = checkBox.checked;
}

ipc.on('receive-collection-path', function(event, path) {
	settings.collectionPath = path;
	field.value = settings.collectionPath;
});

window.onbeforeunload = function() {
	settings.collectionPath = field.value;
	settings.cached = checkBox.checked;
	ipc.send('close-preferences', settings);
};

setBodyDrag();
ipc.send('request-settings');
