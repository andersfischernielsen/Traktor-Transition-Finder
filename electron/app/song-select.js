'use strict';

var ipc = require('ipc');

var dropzone = document.getElementById("dropzone");

dropzone.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});


dropzone.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    
    var reader = new FileReader();
    reader.onloadstart = function(e2) { // finished reading file data.
        ipc.send('song-drop', file.name);
    }
    
    reader.readAsDataURL(file); // start reading the file data.
});