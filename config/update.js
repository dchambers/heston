/* global require */
const fs = require('fs');
const process = require('process');
const AES = require('crypto-js/aes');

fs.readFile('config/unencrypted.config.json', 'utf8', (err, file) => {
  const encryptedFile = AES.encrypt(file, process.env.HESTON_KEY);
  fs.writeFile('config/encrypted.config', encryptedFile.toString());
});
