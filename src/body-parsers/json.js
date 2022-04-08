'use strict';

exports = module.exports = {
  matchesRequest: req => {
    return ['application/json','application/json-rpc'].includes(req.headers['content-type']);
  },
  parseBody: rawBody => JSON.parse(rawBody),
};
