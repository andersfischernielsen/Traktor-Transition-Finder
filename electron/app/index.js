'use strict';

var ipc = require('ipc');

var upload = document.querySelector('.upload');
upload.addEventListener("change", function () {
    ipc.send('collection-upload');
});