var electron = require('electron');
import * as graph from "../../graph";

var ipcSongSelect = electron.ipcRenderer;
var dropzone;

function setSelectDropzone() {
    dropzone = document.getElementById('dropzone');
    
    dropzone.addEventListener('dragover', e => 
    {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', e =>
    {
        e.stopPropagation();
        e.preventDefault();
        dropzone.className = 'dropzone';
    });

    dropzone.addEventListener('drop', e => 
    {
        e.stopPropagation();
        e.preventDefault();
        dropzone.className = 'dropzone';
        var file = e.dataTransfer.files[0];
        ipcSongSelect.send('song-drop', file.name);
    });
}

ipcSongSelect.on('receive-transitions', (event, received : [graph.Song, graph.Edge[]]) => 
{
    debugger;
    dropzone.style.height = '80px';
    dropzone.style.boxShadow = 'box-shadow:inset 0px 0px 0px 2px lightgrey;'
    document.getElementById('inner-dropzone').style.fontSize = '18px';
    let song = received[0];
    let transitions = received[1];

    setChosenSongInfo(song);
    setTransitionInfo(transitions);
});

function setChosenSongInfo(song : graph.Song) {
    var chosenTitle = document.getElementById('chosen-title');
    var chosenArtist = document.getElementById('chosen-artist');
    var chosenKey = document.getElementById('chosen-key');
    var chosenBpm = document.getElementById('chosen-bpm');

    debugger;
    chosenTitle.innerHTML = song.Title;
    chosenArtist.innerHTML = song.Artist;
    chosenKey.innerHTML = song.Key[0].toString() + song.Key[1][0];
    chosenBpm.innerHTML = song.BPM.toString();
}

function setTransitionInfo(transitions : graph.Edge[]) {
    debugger;
    var list = document.getElementById('transition-list');
    setNoDrop(list);

    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }

    transitions.forEach(elem => 
    {
        var item = buildItem(elem.To);
        list.appendChild(item);
        item.style.opacity = '0';
        window.getComputedStyle(item).opacity;
        item.style.opacity = '1';
    });
}

function setNoDrop(list) {
    debugger;
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

function buildItem(song: graph.Song) {
    debugger;
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

    title.innerHTML = song.Title;
    artist.innerHTML = song.Artist;
    key.innerHTML = song.Key[0] + song.Key[1][0];
    bpm.innerHTML = song.BPM.toString();

    keyBpm.appendChild(key);
    keyBpm.appendChild(bpm);

    item.appendChild(title);
    item.appendChild(artist);
    item.appendChild(keyBpm);

    item.addEventListener('click', e =>  
    {
        ipcSongSelect.send('song-drop', null, song.AudioId);
    });

    return item;
}

setSelectDropzone();