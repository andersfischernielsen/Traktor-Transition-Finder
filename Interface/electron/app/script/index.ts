import electron = require('electron');
const ipc = electron.ipcRenderer;
const fs = require('fs');
const remote = electron.remote;
const dialog = remote.dialog;
const app = remote.app;
const Menu = remote.Menu;


function setBodyDrag() {
	var body = document.getElementsByTagName('body')[0];

	//Make the main window ignore drag-n-drop.
	body.addEventListener('dragover', (e) =>
	{    
		e.stopPropagation();
	    e.preventDefault();
	});

	body.addEventListener('dragleave', (e) => 
	{
	    e.stopPropagation();
	    e.preventDefault();
	});

	body.addEventListener('drop', (e) =>
	{
	    e.stopPropagation();
	    e.preventDefault();
	});
}

//On button click in view, ask Electron main process to open file from file system.
function openFile() {
 	dialog.showOpenDialog(
        remote.getCurrentWindow(),
		{
            filters: [ { name: 'Traktor Collection', extensions: ['nml']} ],
            properties: [ 'openFile' ],
            defaultPath: app.getPath('home') + '/Documents/Native Instruments/',
        },
        fileNames => 
		{
      		if (fileNames === undefined) return;
      		var fileName = fileNames[0];
      		ipc.send('collection-upload', fileName);
  	    }
)}

function startSpinnerOnParsing() {
	var select = document.getElementById("collection-select");
	select.parentNode.removeChild(select);
	document.getElementById('spinner').className = 'spinner';
}

ipc.on('parsing-started', event => startSpinnerOnParsing());

//When collection has been uploaded, change view to drop state.
ipc.on('collection-uploaded', event => 
	{
		var drop = document.getElementById("drop-song");
		document.getElementById('spinner').className = '';
		drop.style.visibility = "visible";
	});


function setMenu() {
	let template : Electron.MenuItemOptions[] = [
		{
			label: 'Traktor Transition Finder',
		    submenu: [
		      	{
	        		label: 'About Traktor Transition Finder',
	        		role: 'about'
		      	},
				{
	        		type: 'separator'
		      	},
		      	{
	        		label: 'Preferences...',
					accelerator: 'Command+,',
					click: () => ipc.send('preferences')
		      	},
		      	{
				  	type: 'separator'
		      	},
		      	{
	        		type: 'separator'
		      	},
		      	{
	        		label: 'Services',
	        		submenu: []
		      	},
		      	{
				  	type: 'separator'
		      	},
		      	{
		        	label: 'Hide Electron',
		        	accelerator: 'Command+H',
		        	role: 'hide'
		      	},
		      	{
			        label: 'Hide Others',
			        accelerator: 'Command+Shift+H',
			        role: 'hideothers'
		      	},
		      	{
			        label: 'Show All',
			        role: 'unhide'
		      	},
		      	{
			        type: 'separator'
		      	},
		      	{
		        	label: 'Quit',
		        	accelerator: 'Command+Q',
		        	role: 'quit'
		      	},
		    ]
		},
		  {
			  label: 'Window',
			  submenu: [
				  {
					  label: 'Minimize',
					  accelerator: 'Command+M',
					  role: 'minimize'
				  },
				  {
					  label: 'Close',
					  accelerator: 'Command+W',
					  role: 'close'
				  },
				  {
					  type: 'separator'
				  },
				  {
					  label: 'Bring All to Front',
					  role: 'front'
				  }
			  ]
		  }
	  ];

    var menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

setBodyDrag();
setMenu();
