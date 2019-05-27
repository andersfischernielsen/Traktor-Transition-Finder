import { ipcRenderer, Event } from 'electron';
import { Song, Edge } from '../../graph';

var ipcSongSelect = ipcRenderer;
let dropzone: HTMLElement;

function setSelectDropzone() {
  dropzone = document.getElementById('dropzone');

  dropzone.addEventListener('dragover', (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.stopPropagation();
    e.preventDefault();
    dropzone.className = 'dropzone';
  });

  dropzone.addEventListener('drop', (e) => {
    e.stopPropagation();
    e.preventDefault();
    dropzone.className = 'dropzone';
    var file = e.dataTransfer.files[0];
    ipcSongSelect.send('song-drop', file.name);
  });
}

ipcSongSelect.on(
  'receive-transitions',
  (event: Event, received: [Song, Edge[]]) => {
    dropzone.style.height = '80px';
    dropzone.style.boxShadow = 'box-shadow:inset 0px 0px 0px 2px lightgrey;';
    document.getElementById('inner-dropzone').style.fontSize = '18px';
    const song = received[0];
    const transitions = received[1];

    setChosenSongInfo(song);
    setTransitionInfo(transitions);
  },
);

function setChosenSongInfo(song: Song) {
  const chosenTitle = document.getElementById('chosen-title');
  const chosenArtist = document.getElementById('chosen-artist');
  const chosenKey = document.getElementById('chosen-key');
  const chosenBpm = document.getElementById('chosen-bpm');

  chosenTitle.innerHTML = song.Title;
  chosenArtist.innerHTML = song.Artist;
  chosenKey.innerHTML = song.Key[0].toString() + song.Key[1][0];
  chosenBpm.innerHTML = song.BPM.toString();
}

function setTransitionInfo(transitions: Edge[]) {
  const list = document.getElementById('transition-list');
  setNoDrop(list);

  while (list.hasChildNodes()) {
    list.removeChild(list.firstChild);
  }

  transitions.forEach((elem) => {
    const item = buildItem(elem.To);
    list.appendChild(item);
    item.style.opacity = '0';
    window.getComputedStyle(item).opacity;
    item.style.opacity = '1';
  });
}

function setNoDrop(list) {
  //Make the main window ignore drag-n-drop.
  list.addEventListener('dragover', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  list.addEventListener('dragleave', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  list.addEventListener('drop', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
}

function buildItem(song: Song) {
  const item = document.createElement('div');
  const title = document.createElement('div');
  const artist = document.createElement('div');
  const keyBpm = document.createElement('div');
  const bpm = document.createElement('div');
  const key = document.createElement('div');

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

  item.addEventListener('click', (e) => {
    ipcSongSelect.send('song-drop', song.AudioId);
  });

  return item;
}

setSelectDropzone();
