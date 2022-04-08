'use strict';

const Cookie = require('cookie');
const Base64url = require('base64url');
const Zlib = require('zlib');
const Promisify = require('util').promisify;
const { Models } = require('../../ripcord');

const EncodingVersion = 0;
const prependVersion = str => EncodingVersion + '/' + str;
const serialize = obj => obj.toJSON ? obj.toJSON() : obj;

const zip = Promisify(Zlib.deflate);
const unzip = Promisify(Zlib.unzip);

class CookieStorage {
  async readState(headers) {
    const state = await this.unmarshal(Cookie.parse(headers.cookie || ''));
    if(state.character && state.world) {
      state.character.room = state.world.roomAt(state.character.room.location);
    }
    return state;
  }

  async writeState(state, res) {
    state = await this.marshal(state);
    let cookies = [];
    let keys = Object.keys(state);
    for(let key of keys) {
      cookies.push(Cookie.serialize(key, state[key]));
    }
    res.setHeader('Set-Cookie', cookies);
  }

  async marshal (objects) {
    let strings = {};
    let typeNames = Object.keys(objects);
    for(let typeName of typeNames) {
      if(objects[typeName].toJSON) {
        strings[typeName] = await this.encode(objects[typeName].toJSON());
      } else {
        strings[typeName] = await this.encode(objects[typeName]);
      }
    }
    return strings;
  }

  async encode (pojo) {
    switch(EncodingVersion) {
    case 0:
    default:
      return zip(JSON.stringify(serialize(pojo)))
        .then(Base64url.encode)
        .then(prependVersion);
    }
  }

  // input is like  { world: 'a4fe588acb2-encoded-data-9db1c3' }
  // output is like { world: World { ... instance data ... } }
  async unmarshal (strings) {
    let keys = Object.keys(strings);
    let values = await Promise.all(keys.map(name => this.decode(strings[name])));
    keys.forEach((name, i) => {
      if(Models[name]) {
        strings[name] = Models[name].fromJSON(values[i]);
      } else {
        strings[name] = values[i];
      }
    });
    return strings;
  }

  async decode (rawStr) {
    const [ version, value ] = rawStr.split('/');
    switch(version) {
    case '0':
    default:
      return unzip(Base64url.toBuffer(value)).then(JSON.parse);
    }
  }
}

module.exports = CookieStorage;
