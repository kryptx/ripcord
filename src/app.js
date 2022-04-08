'use strict';

const deps = require('./ripcord');
const methods = require('./methods');
const transports = require('./rpc/transports');
const serializers = require('./rpc/serializers');
const Rpc = require('./rpc/rpc');
const { getStorageModule } = require('./rpc/storage');

let storage = getStorageModule('cookie');
let rpc = new Rpc({ methods, deps });
let http = new transports.HttpTransport({
  rpc,
  serializers: {
    'application/json': serializers.JsonRpc2,
    'application/json-rpc': serializers.JsonRpc2,
  },
  storage
});

http.listen(3000).then(() => deps.Log.info('Listening on port 3000.'));

module.exports = {
  rpc, http
};
