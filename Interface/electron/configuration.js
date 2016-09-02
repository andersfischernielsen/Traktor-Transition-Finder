const app = require('electron').app;
const nconf = require('nconf').file({ file: app.getPath('userData') + '/settings.json' });
function saveSettings(settingKey, settingValue) {
    nconf.set(settingKey, settingValue);
    nconf.save();
}
function readSettings(settingKey) {
    nconf.load();
    return nconf.get(settingKey);
}
module.exports = {
    saveSettings: saveSettings,
    readSettings: readSettings
};
