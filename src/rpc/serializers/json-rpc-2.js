'use strict';

const Joi = require('joi');
const schema = Joi.object({
  jsonrpc: Joi.string().valid('2.0').required().strip(),
  method: Joi.string().required(),
  params: Joi.any(),
  id: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null).default(null)
});

exports = module.exports = {
  accept: ['application/json','application/json-rpc'],
  contentType: 'application/json-rpc',
  matchesRequest: req => {
    return exports.accept.includes(req.headers['content-type']) && (
      req.body.jsonrpc === '2.0' ||
      Array.isArray(req.body.jsonrpc) && req.body.jsonrpc.every(call => call.jsonrpc === '2.0')
    );
  },
  validate: req => {
    // json-rpc can batch multiple calls into a single request
    let schemas = Joi.alternatives().try(schema , Joi.array().items(schema));
    let result = schemas.validate(req.body);
    if(result.error) throw result.error;
    return result.value;
  },

  buildResponse: thing => {
    let envelop = result => {
      let response = { jsonrpc: '2.0', id: result.id };

      if(result instanceof Error) {
        response.error = {
          code: -32700,
          message: result.message,
          stack: result.stack
        };
        response.result = null;
      } else if (result.id) {
        response.result = result.result;
        response.error = null;
      } else {
        // whatever, I didn't want to respond anyway
        return null;
      }

      return JSON.stringify(response);
    };

    return Array.isArray(thing) ?
      thing.map(envelop).filter(i => i !== null) :
      envelop(thing);
  },
};
