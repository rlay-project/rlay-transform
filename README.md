# RlayTransform

RlayTransform transforms various data formats into Rlay Entity Objects. Currently supported data formats are:

- `JSON`

> Other data formats (e.g. XML) are indirectly supported by using an intermediate transformer that transforms to JSON and then using RlayTransform.

## Usage

```javascript
const { RlayTransform } = require('@rlay/transform');
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
  'arrayWithDuplicateObjects': [{ value: { subId: 3 } }, { value: { subId: 3 } }],
  'arrayEmpty': []
};

const entities = RlayTransform.toRlayEntityObjects(rlayClient, 'ExampleObject', json);

await Promise.all(entities.map(e => rlayClient.createEntity(e))));
```

### `.toUnorderedJson`

The above example preserves the order of the arrays, this, however, might not always be desired. If the order of the elements is irrevant `.toUnorderedJson` **replaces all arrays with dedulicated `Set`s**. Calling `.toUnorderedJson` on the above json example would result in the following new json:

```js
      {
        'undefined': undefined,
        'null': null, // DataProperty
        'string': 'abc', // DataProperty
        'stringempty': '', // DataProperty
        'number': 1, // DataProperty
        'boolean': true, // DataProperty
        'date': new Date(), // DataProperty
        'regex': new RegExp(), // DataProperty
        'object': { a: 1, B: 'b' }, // ObjectProperty, Class
        'objectEmpty': { }, // None
        'arrayWithObject': new Set([
          {
            id: 1,
            value: 'a'
          },
          {
            id: 2,
            value: 'b'
          }
        ]),
        'arrayWithNestedObject': new Set([
          {
            id: 1,
            value: {
              subId: 3,
              subValue: 'c'
            }
          },
          {
            id: 2,
            value: new Set([{
              subId: 3,
              subValue: 'c'
            }])
          },
        ]),
        'arrayWithMixedElements': new Set([null, 1, { a: 1, B: 'b' }]),
        'arrayWithStrings': new Set([null, 1, 'a', false]),
        'arrayWithDuplicateObjects': new Set([{ value: { subId: 3 } }]),
        'arrayEmpty': new Set([])
      }
```

The rest remains the same. Pseudo-example from above:

```js
const unorderedJson = RlayTransform.toUnorderedJson(orderedJson);

const entities = RlayTransform.toRlayEntityObjects(rlayClient, 'ExampleObject', unorderedJson);

await Promise.all(entities.map(e => rlayClient.createEntity(e))));
```

Using `.toUnorderedJson` results in less entity payloads (~20%; depending on the json object) and therefore faster creation times.
