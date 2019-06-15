# Rlay Transformer

The Rlay Transformer allows to transform various data formats into Rlay Entity Objects. Currently supported data formats are:

- `JSON`

## Usage

```javascript
const { RlayTransformer } = require('@rlay/transform');
const { Client } = require('@rlay/rlay-client-lib');

const rlayClient = new Client();

const json = {
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

const entities = RlayTransformer.toRlayEntityObjects(rlayClient, 'ExampleObject', json);

await Promise.all(entities.map(e => rlayClient.createEntity(e))));
```
