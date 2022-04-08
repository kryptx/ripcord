'use strict';

const Http = require('http');

class HttpTransport {

  constructor({ rpc, parsers, serializers, storage }) {
    this.rpc = rpc;
    this.parsers = parsers;
    this.serializers = serializers;

    this.server = Http.createServer(async (req, res) => {
      let parser = this.getParser(req);
      let code = 200;
      let result, state, serializer;

      try {
        let args = await Promise.all([
          this.parseBody(req, parser),
          state = storage.readState(req.headers),
        ]);
        serializer = this.getSerializer(req);
        serializer.validate(req);
        result = await this.rpc.Invoke(...args);
      } catch (err) {
        // I believe RPC over HTTP should always use 500,
        // even when the error is better described by another code
        // (not all transports can explicitly encode a reason for failure)
        code = 500;
        result = err;
        // if the parser failed, we don't have a serializer for returning the error
        serializer = serializer || this.getDefaultSerializer(req);
      }

      state = await state;
      await storage.writeState(state, res);
      let response = serializer.buildResponse(result);
      if(response) {
        res.writeHead(code, { 'Content-type': serializer.contentType });
        res.write(response);
      } else {
        res.writeHead(204);
      }
      res.end();
    });
  }

  async parseBody(req, parser) {
    const raw = await this.getBody(req);
    req.body = parser.parseBody(raw);
    return req.body;
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

  // getDefaultSerializer is mainly used to return errors when we have
  // failed to get the serializer the first time.
  // the parser may error, so we can't call matchesRequest()
  getDefaultSerializer(req) {
    // serializers that send what the client has specified they accept
    let candidates = this.serializers.filter(s => s.contentType === req.headers['accept']);
    if (candidates.length) return candidates[0];

    // any serializer that speaks the same basic language they do
    candidates = this.serializers.filter(s => s.accept.includes(req.headers['content-type']));
    if (candidates.length) return candidates[0];

    // can't find a good one, just use the first one we have
    return this.serializers[0];
  }

  getSerializer(req) {
    const candidates = this.serializers.filter(s => s.matchesRequest(req));
    if (candidates.length !== 1) {
      throw new Error('Failed to resolve serializer from request');
    }
    return candidates[0];
  }

  getParser(req) {
    const candidates = this.parsers.filter(p => p.matchesRequest(req));
    if (candidates.length !== 1) {
      throw new Error('Failed to resolve parser from request');
    }
    return candidates[0];
  }
}

module.exports = HttpTransport;
