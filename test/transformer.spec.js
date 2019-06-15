const { RlayTransformer } = require('../src/');
const { Client } = require('@rlay/rlay-client-lib');
const cbor = require('cbor');
const assert = require('assert');

let target;
const rlayClient = new Client();

const simpleJson = {
  'undefined': undefined, // None
  'null': null, // DataProperty
  'string': 'abc', // DataProperty
  'stringempty': '', // DataProperty
  'number': 1, // DataProperty
  'float': 1.15, // DataProperty
  'boolean': true, // DataProperty
  'date': new Date(), // DataProperty
  'regex': new RegExp(), // DataProperty
};

const complexJson = {
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
  'arrayWithMixedElements': [null, 1, { a: 1, B: 'b' }],
  'arrayWithStrings': [null, 1, 'a', false],
  'arrayEmpty': []
};

describe('RlayTransformer', () => {
  beforeEach(() => target = RlayTransformer)

  describe('.toRlayEntityObjects', () => {
    it('works on a simple object', async () => {
      const entities = target.toRlayEntityObjects(rlayClient, 'SimpleObject', simpleJson);
      const undefinedEntities = entities.filter(e => e === undefined);
      assert.equal(undefinedEntities.length, 0);

      //const start = Date.now();
      //console.log(await Promise.all(entities.map(e => rlayClient.createEntity(e))));
      //console.log(Date.now() - start);
    });

    it('works on a complex object', async () => {
      const entities = target.toRlayEntityObjects(rlayClient, 'ComplexObject', complexJson);
      const undefinedEntities = entities.filter(e => e === undefined);
      assert.equal(undefinedEntities.length, 0);
    });

  });

  describe('.toRlaySchemaCidIndex', () => {
    it('works', async () => {
      const entities = target.getRlaySchemaCidIndex();
    });
  });

  describe('.toRlaySchemaObjectIndex', () => {
    it('works', async () => {
      const entities = target.getRlaySchemaObjectIndex();
      assert.deepEqual(Object.keys(entities[0]), ['key', 'assertion']);
    });
  });

});
