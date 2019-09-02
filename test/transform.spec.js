/* eslint-env node, mocha */
const { RlayTransform } = require('../src/');
const { Client } = require('@rlay/rlay-client-lib');
const pLimit = require('p-limit');
const assert = require('assert');
const { ordered, unordered } = require('./data');

let target;
const rlayClient = new Client();

const clone = json => JSON.parse(JSON.stringify(json))

const hasDuplicatePropertyCids = (individual) => {
  const propCids = Object.keys(individual).
    filter(key => key !== 'type').
    map(key => individual[key]);
  return propCids.length !== new Set(propCids).size
}

describe('RlayTransform', () => {
  beforeEach(() => target = RlayTransform)

  describe('.toUnorderedJson', () => {
    it('transform all arrays to sets', () => {
      assert.deepEqual(RlayTransform.toUnorderedJson(ordered.getData()), unordered.getData());
    });
  });

  describe('.toRlayEntityObjects', () => {

    context('unordered json', () => {
      Object.keys(unordered.getData()).forEach(key => {
        context(`${key} properties`, () => {
          let entities = [];

          before(() => {
            const obj = {};
            obj[key] = unordered.getData()[key];
            entities = target.toRlayEntityObjects(rlayClient, key, obj);
          });

          it('has no `undefined` entities', () => {
            const undefinedEntities = entities.filter(e => e === undefined);
            assert.equal(undefinedEntities.length, 0);
          });

          it(`produces ${unordered.getEntityLength()[key]} entities`, () => {
            assert.equal(entities.length, unordered.getEntityLength()[key]);
          });

          it('has Individual ordered last', () => {
            const indi = entities.slice(-1).pop();
            assert.equal(indi.type, 'Individual');
          });

          it('Individual has no duplicate property CIDs', () => {
            const indi = entities.slice(-1).pop();
            assert.equal(hasDuplicatePropertyCids(indi), false);
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
    });

    context('ordered json', () => {
      Object.keys(ordered.getData()).forEach(key => {
        context(`${key} properties`, () => {
          let entities = [];

          before(() => {
            const obj = {};
            obj[key] = ordered.getData()[key];
            entities = target.toRlayEntityObjects(rlayClient, key, obj);
          });

          it('has no `undefined` entities', () => {
            const undefinedEntities = entities.filter(e => e === undefined);
            assert.equal(undefinedEntities.length, 0);
          });

          it(`produces ${ordered.getEntityLength()[key]} entities`, () => {
            assert.equal(entities.length, ordered.getEntityLength()[key]);
          });

          it('has Individual ordered last', () => {
            const indi = entities.slice(-1).pop();
            assert.equal(indi.type, 'Individual');
          });

          it('Individual has no duplicate property CIDs', () => {
            const indi = entities.slice(-1).pop();
            assert.equal(hasDuplicatePropertyCids(indi), false);
          });

          it('decodes annotation values correctly', () => {
            const dpas = entities.filter(e => e.type === 'Annotation');
            const dpaValues = dpas.map(dpa => rlayClient.rlay.decodeValue(dpa.value));
            assert.deepEqual(dpaValues, ordered.getAnnotationValues()[key]);
          });
        });
      });
    });

    it('works on a complex object', async () => {
      const entities = target.toRlayEntityObjects(rlayClient, 'ComplexObject', ordered.getData());
      const undefinedEntities = entities.filter(e => e === undefined);
      assert.equal(undefinedEntities.length, 0);
    });

    it('works on problematic objects (Array)', async () => {
      const problematicJsonArray = {
        'arrayWithNestedObject': [
          { value: { subId: 3 } },
          { value: { subId: 3 } }
        ]
      };
      const entities = target.toRlayEntityObjects(rlayClient, 'ProblematicObject', problematicJsonArray);
      const mainI = entities.slice(-1).pop();
      assert.equal(entities.length, 23);
      assert.deepEqual(mainI.object_property_assertions, [
        '0x019a80031b20852139a92a1296bd397748fd7b61a1c27543ea71f173f5f16a37a7422d7ab23b',
        '0x019a80031b20b3dc311bbb808bd9438c7fa8ffe89a84d2146aac454ffa1748f034f4ba942dd0'
      ]);
    });

    it('works on problematic objects (Set)', async () => {
      const problematicJsonArray = target.toUnorderedJson({
        'arrayWithNestedObject': [
          { value: { subId: 3 } },
          { value: { subId: 3 } }
        ]
      });
      const entities = target.toRlayEntityObjects(rlayClient, 'ProblematicObject', problematicJsonArray);
      assert.equal(entities.length, 19);
      const mainI = entities.slice(-1).pop();
      assert.deepEqual(mainI.object_property_assertions, [
        '0x019a80031b20bcad667630c9f21e62f965120e7c7daf6e2130c276e22ae7a45572b9878c90ce'
      ]);
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
});
