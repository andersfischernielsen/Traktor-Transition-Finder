'use strict';

var ipc = require('ipc');
var fs = require('fs');

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


//On button click in view, ask Electron main process to open file from file system.
function openFile() {
	var remote = require('remote');
	var dialog = remote.require('dialog');

 	dialog.showOpenDialog(
        remote.getCurrentWindow(), 
		{ 
            filters: [ { name: 'Traktor Collection', extensions: ['nml']} ], 
            properties: [ 'openFile' ]
        }, 
        function (fileNames) {
      		if (fileNames === undefined) return;
      		var fileName = fileNames[0];
      		ipc.send('collection-upload', fileName);
            document.getElementById('spinner').className = 'spinner';
  	    }
)}

//When collection has been uploaded, change view to drop state.
ipc.on('collection-uploaded', function() {
    var drop = document.getElementById("drop-song");
    var select = document.getElementById("collection-select");
    select.parentNode.removeChild(select);
    drop.style.visibility = "visible";
});
