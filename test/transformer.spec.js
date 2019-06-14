const { RlayTransformer } = require('../src/');
const { Client } = require('@rlay/rlay-client-lib');
const cbor = require('cbor');

let target;
const rlayClient = new Client();
rlayClient.rlay.encodeValue = val => {
  const bytesToHex = (bytes) => {
    let hex = [];

    for (let i = 0; i < bytes.length; i++) {
      hex.push((bytes[i] >>> 4).toString(16));
      hex.push((bytes[i] & 0xf).toString(16));
    }

    return `0x${hex.join('').replace(/^0+/, '')}`;
  };

  return bytesToHex(cbor.encode(val));
}

const simpleJson = {
  'undefined': undefined, // None
  'null': null, // DataProperty
  'string': 'abc', // DataProperty
  'stringempty': '', // DataProperty
  'number': -1, // DataProperty
  'float': 1.15, // DataProperty
  'boolean': true, // DataProperty
  'date': new Date(), // DataProperty
  'regex': new RegExp(), // DataProperty
};

const testJson = {
  'undefined': undefined, // None
  'null': null, // DataProperty
  'string': 'abc', // DataProperty
  'stringempty': '', // DataProperty
  'number': 1, // DataProperty
  'boolean': true, // DataProperty
  'date': new Date(), // DataProperty
  'regex': new RegExp(), // DataProperty
  'object': { a: 1, B: 'b' }, // ObjectProperty, Class
  'objectEmpty': { }, // None
  'arrayWithObject': [
    {
      id: 1,
      value: 'a'
    },
    {
      id: 2,
      value: 'b'
    }
  ],
  'arrayWithNestedObject': [
    {
      id: 1,
      value: {
        subId: 3,
        subValue: 'c'
      }
    },
    {
      id: 2,
      value: [{
        subId: 3,
        subValue: 'c'
      }]
    },
  ],
  'arrayWithStrings': [null, 1, 'a', false],
  'arrayEmpty': []
};

describe('RlayTransformer', () => {
  beforeEach(() => target = RlayTransformer)

  describe('.toRlayEntityObjects', () => {
    it('works on a simple object', async () => {
      const entities = target.toRlayEntityObjects(rlayClient, 'SimpleObject', simpleJson);
      console.log(entities);
      const start = Date.now();
      console.log(await Promise.all(entities.map(e => rlayClient.createEntity(e))));
      console.log(Date.now() - start);
    });

  });

});
