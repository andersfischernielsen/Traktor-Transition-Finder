'use strict';

var ipc = require('ipc');
var fs = require('fs');

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

ipc.on('collection-uploaded', function() {
    var drop = document.getElementById("drop-song");
    var select = document.getElementById("collection-select");
    select.parentNode.removeChild(select);
    drop.style.visibility = "visible";
});
