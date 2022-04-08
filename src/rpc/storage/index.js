'use strict';

const CookieStorage = require('./cookie');

function getStorageModule() {
  return new CookieStorage();
}

module.exports = {
  CookieStorage,
  getStorageModule
};
