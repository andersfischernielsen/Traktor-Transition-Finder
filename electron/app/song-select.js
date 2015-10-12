'use strict';

var ipc = require('ipc');

var dropzone = document.getElementById("dropzone");

dropzone.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    dropzone.className = dropzone.className + " dragover";
});

dropzone.addEventListener('dragleave', function(e) {
    e.stopPropagation();
    e.preventDefault();
    dropzone.className = "dropzone";
});

dropzone.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    dropzone.className = "dropzone";
    var file = e.dataTransfer.files[0];
    
    var reader = new FileReader();
    reader.onloadstart = function(e2) { // finished reading file data.
        ipc.send('song-drop', file.name);
    }
    
    reader.readAsDataURL(file); // start reading the file data.
});

ipc.on('receive-transitions', function (arg) {
    dropzone.style.height = '80px';
    dropzone.style.boxShadow = 'box-shadow:inset 0px 0px 0px 2px lightgrey;'
    document.getElementById('inner-dropzone').style.fontSize = '18px';
    var received = JSON.parse(arg);
    var song = received.song;
    var transitions = received.transitions;
    
    setChosenSongInfo(song);
    setTransitionInfo(transitions);
});

function setChosenSongInfo(song) {
    var main = document.getElementById('chosen-maindisplay');
    main.innerHTML = song.title;
    
    var subKey = document.getElementById('subdisplay-key');
    subKey.innerHTML = song.key.item1 + song.key.item2.case[0];    
    var subBpm = document.getElementById('subdisplay-bpm');
    subBpm.innerHTML = song.bpm;  
}

function setTransitionInfo(transitions) {
    var list = document.getElementById('transition-list');
    
    for (var i = 0; i < list.childNodes.length; i++) {
        list.removeChild(list.childNodes[i]);
    }
    
    transitions.forEach(function(elem) {
        var div = document.createElement('div');
        div.className = 'row transition-list-element';
        
        var title = document.createElement('div');
        title.className = 'col-xs-7 song-title';
        title.appendChild(document.createTextNode(elem.title));
        
        var bpm = document.createElement('div');
        bpm.className = 'col-xs-3'
        bpm.appendChild(document.createTextNode(elem.bpm));
        
        var key = document.createElement('div');
        key.className = 'col-xs-1'
        key.appendChild(document.createTextNode(elem.key.item1 + elem.key.item2.case[0]));
        
        div.appendChild(title);
        div.appendChild(bpm);
        div.appendChild(key);
        list.appendChild(div);
    });
}
