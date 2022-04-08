/*eslint-env mocha */
'use strict';

const CookieStorage = require('./cookie');
const Assert = require('chai').assert;

const storage = new CookieStorage();

// name like "modem"
const endec = async orig => {
  let encoded = await storage.encode(orig);
  let decoded = await storage.decode(encoded);
  Assert.deepEqual(decoded, orig);
};

describe('Cookie Storage', () => {
  it('should unmarshal a whole state object containing multiple encoded objects', async () => {
    let result = await storage.unmarshal({ foo: '0/eJyrVspLzE1VslJKy89XqgUAIt4EoA', bar: '0/eJyrVspLzE1VslJKSixSqgUAIpsEkQ' });
    Assert.deepEqual(result.foo, { name: 'foo' });
    Assert.deepEqual(result.bar, { name: 'bar' });
  });

  it('should marshal state into a state object containing multiple encoded strings', async () => {
    let result = await storage.marshal({ foo: { name: 'foo' }, bar: { name: 'bar' } });
    Assert.isString(result.foo);
    Assert.isString(result.bar);
  });

  it('should encode and decode a simple object', async () => {
    return endec({ foo: 'bar', number: 5, boolean: false, missing: null });
  });

  it('should be able to encode and decode an array, preserving order', async () => {
    return endec([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]);
  });

  it('should handle arrays as properties', async () => {
    return endec({ someValue: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] });
  });

  it('should handle mixed arrays', async () => {
    return endec({
      someValues: [
        // we cannot use 'undefined'; that is not valid JSON
        // and therefore not allowed in JSON-RPC (a good thing)
        'staple',
        { horse: 'battery', five: ['12', 22 ] },
        12, null, true
      ]
    });
  });

  it('should handle nested arrays', async () => {
    return endec([ 1, 2, 3, [ 0, 1, 1, 0 ], [ 2, 0, [ 3, 5 ]]]);
  });
});
