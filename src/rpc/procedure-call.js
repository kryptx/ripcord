'use strict';

const Joi = require('joi');

const getSchema = (paramsSchema = Joi.any()) =>
  Joi.object().keys({
    state: Joi.object().default({}),
    method: Joi.object().keys({
      handle: Joi.func(),
      schema: Joi.object().schema(),
    }).required().options({ allowUnknown: true }),
    params: paramsSchema,
    id: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null).default(null),
  }).unknown(true);

class ProcedureCall {
  constructor(options) {
    let result = getSchema(options.method.schema).validate(options);
    if(result.error) {
      throw result.error;
    }

    this.method = result.value.method;
    this.params = result.value.params;
    this.id = result.value.id;
  }

  async execute(deps, state) {
    this.result = await this.method.handle(this.params, deps, state);
    return this;
  }
}

module.exports = ProcedureCall;
