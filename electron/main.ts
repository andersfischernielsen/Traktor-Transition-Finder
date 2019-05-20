import { app, ipcMain, BrowserWindow, Event } from 'electron';
import { CollectionParser, Song, Edge, Graph } from './graph';

const ipc = ipcMain;
import { readSettings } from './configuration';

let mainWindow: BrowserWindow;
// let preferencesWindow: BrowserWindow;
let collectionPath: string;
let builtGraph: Map<string, [Song, Edge[]]>;

app.on('ready', () => {
  setAppEvents();
  setIpcEvents();
  setUpMainWindow(false);

  let collectionPath = readSettings('collectionPath');
  if (collectionPath) {
    mainWindow.webContents.on('did-finish-load', () =>
      buildGraph(collectionPath),
    );
  }
});

function setAppEvents() {
  app.on('window-all-closed', () => app.quit());
}

function setIpcEvents() {
  ipc.on('song-drop', (event: Event, fileName: string) =>
    chooseSong(event, fileName),
  );
  //   ipc.on('preferences', (event: Event, arg: string) => spawnPreferences());
  ipc.on('collection-path-request', (event: Event) => {
    if (collectionPath)
      event.sender.send('receive-collection-path', collectionPath);
  });
  ipc.on('collection-upload', (event: Event, path: string) => {
    buildGraph(path).then((p) => {
      collectionPath = p;
    });
  });
}

function setUpMainWindow(devTools = false) {
  mainWindow = new BrowserWindow({
    minWidth: 350,
    width: 400,
    height: 600,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.loadURL('file://' + __dirname + '/app/view/index.html');

  mainWindow.on('closed', () => {
    // if (preferencesWindow != null) {
    //   preferencesWindow.close();
    // }
    // preferencesWindow = null;
    mainWindow = null;
  });

  if (devTools) mainWindow.webContents.openDevTools();
}

const buildGraph = async (path: string) => {
  const edges = readSettings('numberOfEdges')
    ? readSettings('numberOfEdges')
    : 8;
  mainWindow.webContents.send('parsing-started');
  const parsed = await CollectionParser.parseCollection(path);
  const result = Graph.buildGraph(parsed, edges);
  builtGraph = Graph.asMap(result);
  mainWindow.webContents.send('collection-uploaded');
  return path;
};

function chooseSong(event: Event, fileName: string) {
  const transitions = builtGraph[fileName];
  event.sender.send('receive-transitions', transitions);
}

// function spawnPreferences() {
//   if (preferencesWindow) return;

//   preferencesWindow = new BrowserWindow({
//     width: 530,
//     height: 270,
//     resizable: false,
//     webPreferences: {
//       nodeIntegration: true,
//     },
//   });
//   preferencesWindow.loadURL(
//     'file://' + __dirname + '/app/view/preferences.html',
//   );

//   preferencesWindow.on('closed', () => (preferencesWindow = null));
// }
