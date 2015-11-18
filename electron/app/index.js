'use strict';

var ipc = require('electron').ipcRenderer;
var fs = require('fs');
var remote = require('remote');
var dialog = remote.require('dialog');
var app = remote.require('app')
var Menu = remote.require('menu');


function setBodyDrag() {
	var body = document.getElementsByTagName('body')[0];

	//Make the main window ignore drag-n-drop.
	body.addEventListener('dragover', function(e) {
	    e.stopPropagation();
	    e.preventDefault();
	});

	body.addEventListener('dragleave', function(e) {
	    e.stopPropagation();
	    e.preventDefault();
	});

	body.addEventListener('drop', function(e) {
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
        function (fileNames) {
      		if (fileNames === undefined) return;
      		var fileName = fileNames[0];
      		ipc.send('collection-upload', fileName);
        	document.getElementById('spinner').className = 'spinner';
  	    }
)}

//When collection has been uploaded, change view to drop state.
ipc.on('collection-uploaded', function() {
    var drop = document.getElementById("drop-song");
    var select = document.getElementById("collection-select");
    select.parentNode.removeChild(select);
    drop.style.visibility = "visible";
});


function setMenu() {
	var template = [
		{
			label: 'Traktor Auto Next Song',
		    submenu: [
		      	{
	        		label: 'About Traktor Auto Next Song',
	        		selector: 'orderFrontStandardAboutPanel:'
		      	},
				{
	        		type: 'separator'
		      	},
		      	{
	        		label: 'Preferences...',
					accelerator: 'Command+,',
					click: function() { ipc.send('preferences'); }
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
		        	selector: 'hide:'
		      	},
		      	{
			        label: 'Hide Others',
			        accelerator: 'Command+Shift+H',
			        selector: 'hideOtherApplications:'
		      	},
		      	{
			        label: 'Show All',
			        selector: 'unhideAllApplications:'
		      	},
		      	{
			        type: 'separator'
		      	},
		      	{
		        	label: 'Quit',
		        	accelerator: 'Command+Q',
		        	selector: 'terminate:'
		      	},
		    ]
		},
		  {
			  label: 'Window',
			  submenu: [
				  {
					  label: 'Minimize',
					  accelerator: 'Command+M',
					  selector: 'performMiniaturize:'
				  },
				  {
					  label: 'Close',
					  accelerator: 'Command+W',
					  selector: 'performClose:'
				  },
				  {
					  type: 'separator'
				  },
				  {
					  label: 'Bring All to Front',
					  selector: 'arrangeInFront:'
				  }
			  ]
		  }
	  ];

    var menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

setBodyDrag();
setMenu();
