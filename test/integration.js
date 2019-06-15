const { RlayTransformer } = require('../src/');
const { Client } = require('@rlay/rlay-client-lib');

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


const main = async () => {
  const entities = RlayTransformer.toRlayEntities(rlayClient, 'SimpleObject', simpleJson);
  const i = entities[entities.length - 1];
  console.log('Main Individual CID:', i.cid);

  console.log('saving ....');
  console.log(await Promise.all(entities.map(e => rlayClient.createEntity(e.payload))));
  console.log('saved');

  rlayClient.initSchema(
    RlayTransformer.getRlaySchemaCidIndex(),
    RlayTransformer.getRlaySchemaObjectIndex()
  );

  console.log(await rlayClient.Individual.find(i.cid));
}

main();
