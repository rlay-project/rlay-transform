# Rlay Transformer

The Rlay Transformer allows to transform various data formats into Rlay Entity Objects. Currently supported data formats are:

- `JSON`

## Usage

```javascript
const { RlayTransformer } = require('@rlay/transformer');
const { Client } = require('@rlay/rlay-client-lib');

const rlayClient = new Client;

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

const entities = RlayTransformer.toRlayEntityObjects(rlayClient, 'SimpleObject', simpleJson);

await Promise.all(entities.map(e => rlayClient.createEntity(e))));
```
