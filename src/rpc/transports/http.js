'use strict';

const Http = require('http');

class HttpTransport {

  constructor({ rpc, serializers, storage }) {
    this.rpc = rpc;
    this.serializers = serializers;

    this.server = Http.createServer(async (req, res) => {
      let serializer = this.getSerializer(req.headers['content-type']);
      let code = 200;
      let result, state;

      try {
        let args = await Promise.all([
          this.getBody(req).then(serializer.deserialize),
          state = storage.readState(req.headers)
        ]);
        result = await this.rpc.Invoke(...args);
      } catch (err) {
        // I believe RPC over HTTP should always use 500,
        // even when the error is better described by another code
        // (not all transports can explicitly encode a reason for failure)
        code = 500;
        result = err;
      }

      state = await state;
      await storage.writeState(state, res);
      let response = serializer.serialize(result);
      if(response) {
        res.writeHead(code, { 'Content-type': serializer.ContentType });
        res.write(response);
      } else {
        res.writeHead(204);
      }
      res.end();
    });
  }

  async getBody(req) {
    return new Promise(resolve => {
      let body = '';
      req.on('data', data => body += data);
      req.on('end', () => resolve(body));
    });
  }

  async listen(port) {
    return this.server.listen(port);
  }

  async close() {
    this.server.close();
    return this.server;
  }

  getSerializer(type) {
    return this.serializers[type] || this.serializers['application/json'];
  }
}

module.exports = HttpTransport;
