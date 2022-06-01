var cryptoJS = require('crypto-js');
var secretKey = '19a07b650f031edcd09fb5a1ca6Iw$rvn';

module.exports = Object.freeze({
  encryptData : (data) => {
    try {
      let encrypted = cryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString()
      return encrypted;
    } catch (e) {
      console.log(e);
    }
  },
  decryptData : (data) => {
    try {
      const bytes = cryptoJS.AES.decrypt(data,secretKey);
      if (bytes.toString()) {
        return JSON.parse(bytes.toString(cryptoJS.enc.Utf8));
      }
      return data;
    } catch (e) {
      console.log(e);
    }
  }
});
