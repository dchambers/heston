import fs from 'fs';
import process from 'process';
import CryptoJS from 'crypto-js';
import exampleConfig from './example.config.json';
let configData;

if(!process.env.HESTON_KEY) {
  configData = exampleConfig;
}
else {
  const encryptedFile = fs.readFileSync('config/encrypted.config', {encoding: 'utf8'});
  const file = CryptoJS.AES.decrypt(encryptedFile, process.env.HESTON_KEY);
  configData = JSON.parse(file.toString(CryptoJS.enc.Utf8));
}

export default configData;
