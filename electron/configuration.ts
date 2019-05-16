import { app } from 'electron';
import * as nconf from 'nconf';
import * as fs from 'fs';

const conf = nconf
  .argv()
  .env()
  .file({
    file: app.getPath('userData') + '/settings.json',
  });

export const saveSettings = (settingKey: string, settingValue: string) => {
  conf.set(settingKey, settingValue);
  nconf.save(function(err: Error) {
    fs.readFile(app.getPath('userData') + '/settings.json', (err, data) => {
      console.dir(JSON.parse(data.toString()));
    });
  });
};

export const readSettings = (settingKey: string) => {
  conf.load();
  return conf.get(settingKey);
};
