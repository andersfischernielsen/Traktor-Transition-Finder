'use strict';

var ipc = require('ipc');

var dropzone = document.getElementById('dropzone');

dropzone.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    dropzone.className = dropzone.className + ' dragover';
});

dropzone.addEventListener('dragleave', function(e) {
    e.stopPropagation();
    e.preventDefault();
    dropzone.className = 'dropzone';
});

dropzone.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    dropzone.className = 'dropzone';
    var file = e.dataTransfer.files[0];
    var reader = new FileReader();
    reader.onloadstart = function(e2) {
        ipc.send('song-drop', file.name);
    }
    reader.readAsDataURL(file);
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
    var chosenTitle = document.getElementById('chosen-title');
    chosenTitle.innerHTML = song.title;

    var chosenArtist = document.getElementById('chosen-artist');
    chosenArtist.innerHTML = song.artist;
    
    var chosenKey = document.getElementById('chosen-key');
    chosenKey.innerHTML = song.key.item1 + song.key.item2.case[0];

    var chosenBpm = document.getElementById('chosen-bpm');
    chosenBpm.innerHTML = song.bpm;  
}

function setTransitionInfo(transitions) {
    var list = document.getElementById('transition-list');

    for (var i = 0; i < list.childNodes.length; i++) {
        list.removeChild(list.childNodes[i]);
    }
    
    transitions.forEach(function(elem) {
        var item = document.createElement('div');
        item.className = 'list-item';

        var title = document.createElement('div');
        title.className = 'list-item-title ellipsis-overflow';

        var artist = document.createElement('div');
        artist.className = 'list-item-artist ellipsis-overflow';

        var keyBpm = document.createElement('div');
        keyBpm.className = 'list-item-key-bpm blue-color';

        var bpm = document.createElement('div');
        bpm.className = 'list-item-bpm';

        var key = document.createElement('div');
        key.className = 'list-item-key';

        title.innerHTML = elem.title;
        artist.innerHTML = elem.artist;
        key.innerHTML = elem.key.item1 + elem.key.item2.case[0];
        bpm.innerHTML = elem.bpm;

        keyBpm.appendChild(key);
        keyBpm.appendChild(bpm);

        item.appendChild(title);
        item.appendChild(artist);
        item.appendChild(keyBpm);
        
        list.appendChild(item).animate;
    });
}
