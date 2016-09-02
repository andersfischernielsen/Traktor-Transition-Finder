"use strict";
const electron = require('electron');
const ipcSongSelect = electron.ipcRenderer;
var dropzone;
function setDropzone() {
    dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', e => {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', e => {
        e.stopPropagation();
        e.preventDefault();
        dropzone.className = 'dropzone';
    });
    dropzone.addEventListener('drop', e => {
        e.stopPropagation();
        e.preventDefault();
        dropzone.className = 'dropzone';
        var file = e.dataTransfer.files[0];
        var reader = new FileReader();
        reader.onloadstart = e2 => {
            ipcSongSelect.send('song-drop', file.name);
        };
        reader.readAsDataURL(file);
    });
}
ipcSongSelect.on('receive-transitions', (event, arg) => {
    dropzone.style.height = '80px';
    dropzone.style.boxShadow = 'box-shadow:inset 0px 0px 0px 2px lightgrey;';
    document.getElementById('inner-dropzone').style.fontSize = '18px';
    let received = JSON.parse(arg);
    let song = received.song;
    let transitions = received.transitions;
    setChosenSongInfo(song);
    setTransitionInfo(transitions);
});
function setChosenSongInfo(song) {
    var chosenTitle = document.getElementById('chosen-title');
    var chosenArtist = document.getElementById('chosen-artist');
    var chosenKey = document.getElementById('chosen-key');
    var chosenBpm = document.getElementById('chosen-bpm');
    chosenTitle.innerHTML = song.title;
    chosenArtist.innerHTML = song.artist;
    chosenKey.innerHTML = song.key.item1 + song.key.item2.case[0];
    chosenBpm.innerHTML = song.bpm;
}
function setTransitionInfo(transitions) {
    var list = document.getElementById('transition-list');
    setNoDrop(list);
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
    transitions.forEach(elem => {
        var item = buildItem(elem);
        list.appendChild(item);
        item.style.opacity = '0';
        window.getComputedStyle(item).opacity;
        item.style.opacity = '1';
    });
}
function setNoDrop(list) {
    //Make the main window ignore drag-n-drop.
    list.addEventListener('dragover', e => {
        e.stopPropagation();
        e.preventDefault();
    });
    list.addEventListener('dragleave', e => {
        e.stopPropagation();
        e.preventDefault();
    });
    list.addEventListener('drop', e => {
        e.stopPropagation();
        e.preventDefault();
    });
}
function buildItem(elem) {
    let item = document.createElement('div');
    let title = document.createElement('div');
    let artist = document.createElement('div');
    let keyBpm = document.createElement('div');
    let bpm = document.createElement('div');
    let key = document.createElement('div');
    item.className = 'list-item';
    title.className = 'list-item-title ellipsis-overflow';
    artist.className = 'list-item-artist ellipsis-overflow';
    keyBpm.className = 'list-item-key-bpm blue-color';
    bpm.className = 'list-item-bpm';
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
    item.addEventListener('click', e => {
        ipcSongSelect.send('song-drop', null, elem.audioId);
    });
    return item;
}
setDropzone();
