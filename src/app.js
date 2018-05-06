'use strict';

const deps = require('./ripcord');
const methods = require('./methods');
const transports = require('./rpc/transports');
const serializers = require('./rpc/serializers');
const Rpc = require('./rpc/rpc');

const readState = transports.HttpTransport.readState;
const writeState = transports.HttpTransport.writeState;

let app = new Rpc({ methods, deps });

let http = new transports.HttpTransport({
  rpc: app,
  port: 3000,
  serializers: {
    'application/json': serializers.JsonRpc2,
    'application/json-rpc': serializers.JsonRpc2,
  },
  readState: async headers =>
    deps.StateMarshal.unmarshal(await readState(headers)),

  writeState: async (state, res) =>
    writeState(await deps.StateMarshal.marshal(state), res)
});

http.listen(deps);

module.exports = app;
