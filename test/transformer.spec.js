/* eslint-env node, mocha */
const { RlayTransformer } = require('../src/');
const { Client } = require('@rlay/rlay-client-lib');
const assert = require('assert');

let target;
const rlayClient = new Client();

const entitiesLength = {
  'undefined': 4,
  'null': 7,
  'string': 7,
  'stringempty': 7,
  'number': 7,
  'boolean': 7,
  'date': 7,
  'regex': 7,
  'object': 17,
  'objectEmpty': 11,
  'arrayWithObject': 28,
  'arrayWithNestedObject': 48,
  'arrayWithMixedElements': 20,
  'arrayWithStrings': 10,
  'arrayEmpty': 4
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

    Object.keys(complexJson).forEach(key => {
      context(`${key} properties`, () => {
        let entities = [];

        before(() => {
          const obj = {};
          obj[key] = complexJson[key];
          entities = target.toRlayEntityObjects(rlayClient, key, obj);
        });

        it('has no `undefined` entities', () => {
          const undefinedEntities = entities.filter(e => e === undefined);
          assert.equal(undefinedEntities.length, 0);
        });

        it(`produces ${entitiesLength[key]} entities`, () => {
          assert.equal(entities.length, entitiesLength[key]);
        });

        it('decodes annotation values correctly', () => {
          const dpas = entities.filter(e => e.type === 'Annotation');
          const dpaValues = dpas.map(dpa => rlayClient.rlay.decodeValue(dpa.value));
          assert.equal(dpaValues.includes(`RlayTransform.${key}`), true);
          if (!['undefined', 'arrayEmpty'].includes(key)) {
            assert.equal(dpaValues.includes(`RlayTransform.${key}.${key}`), true);
          }
        });
      });
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
