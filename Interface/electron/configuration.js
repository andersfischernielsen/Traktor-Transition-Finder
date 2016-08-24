'use strict';

var app = require('app');
var nconf = require('nconf').file({file: getUserDataPath() + '/settings.json'});

function saveSettings(settingKey, settingValue) {
    nconf.set(settingKey, settingValue);
    nconf.save();
}

function readSettings(settingKey) {
    nconf.load();
    return nconf.get(settingKey);
}

function getUserDataPath() {
    return app.getPath('userData');
}

module.exports = {
    saveSettings: saveSettings,
    readSettings: readSettings
};