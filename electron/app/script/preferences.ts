import { ipcRenderer, remote, Event } from 'electron';
const ipcPreferences = ipcRenderer;
const configuration = remote.require('./configuration');

const field = <HTMLInputElement>(
  document.getElementById('collection-path-field')
);
const checkBox = document.getElementById('cacheCheck');
const edgesField = <HTMLInputElement>(
  document.getElementById('graph-edges-field')
);
const transitionsField = <HTMLInputElement>(
  document.getElementById('transition-number-field')
);

const setPreferencesBodyDrag = () => {
  const body = document.getElementsByTagName('body')[0];

  //Make the main window ignore drag-n-drop.
  body.addEventListener('dragover', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  body.addEventListener('dragleave', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  body.addEventListener('drop', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
};

const requestCurrentCollectionPath = () => {
  ipcPreferences.send('collection-path-request');
};

ipcPreferences.on('receive-collection-path', (event: Event, path: string) => {
  field.value = path;
});

const retrieveSettings = () => {
  const path = configuration.readSettings('collectionPath');
  const transitions = configuration.readSettings('transitions');
  const edges = configuration.readSettings('numberOfEdges');
  //var cached = configuration.readSettings('cached');

  if (path) field.value = path;
  if (typeof transitions != 'undefined') transitionsField.value = transitions;
  if (typeof edges != 'undefined') edgesField.value = edges;
  //if (typeof cached != 'undefined') checkBox.checked = cached;
};

window.onbeforeunload = () => {
  configuration.saveSettings('collectionPath', field.value);
  configuration.saveSettings('transitions', transitionsField.value);
  configuration.saveSettings('numberOfEdges', edgesField.value);
  //configuration.saveSettings('cached', checkBox.checked);
};

setPreferencesBodyDrag();
retrieveSettings();
