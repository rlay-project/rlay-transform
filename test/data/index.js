const clone = json => JSON.parse(JSON.stringify(json))

module.exports = {
  ordered: {
    getData: () => {
      return {
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
      }
    },
    getEntityLength: () => {
      return {
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
        'arrayWithObject': 23,
        'arrayWithNestedObject': 34,
        'arrayWithMixedElements': 23,
        'arrayWithStrings': 16,
        'arrayWithDuplicateObjects': 23,
        'arrayEmpty': 4
      }
    },
    getAnnotationValues: () => {
      return {
        'undefined': ['RlayTransform.undefined'],
        'null': ['RlayTransform.null', 'RlayTransform.null.null'],
        'string': ['RlayTransform.string', 'RlayTransform.string.string'],
        'stringempty': ['RlayTransform.stringempty', 'RlayTransform.stringempty.stringempty'],
        'number': ['RlayTransform.number', 'RlayTransform.number.number'],
        'boolean': ['RlayTransform.boolean', 'RlayTransform.boolean.boolean'],
        'date': ['RlayTransform.date', 'RlayTransform.date.date'],
        'regex': ['RlayTransform.regex', 'RlayTransform.regex.regex'],
        'object': [
          'RlayTransform.object',
          'RlayTransform.object.object',
          'RlayTransform.object.object',
          'RlayTransform.object.object.a',
          'RlayTransform.object.object.B'
        ],
        'objectEmpty': [
          'RlayTransform.objectEmpty',
          'RlayTransform.objectEmpty.objectEmpty',
          'RlayTransform.objectEmpty.objectEmpty'
        ],
        'arrayWithObject': [
          'RlayTransform.arrayWithObject',
          'RlayTransform.arrayWithObject.arrayWithObject.0',
          'RlayTransform.arrayWithObject.arrayWithObject',
          'RlayTransform.arrayWithObject.arrayWithObject.id',
          'RlayTransform.arrayWithObject.arrayWithObject.value',
          'RlayTransform.arrayWithObject.arrayWithObject.1'
        ],
        'arrayWithNestedObject': [
          'RlayTransform.arrayWithNestedObject',
          'RlayTransform.arrayWithNestedObject.arrayWithNestedObject.0',
          'RlayTransform.arrayWithNestedObject.arrayWithNestedObject',
          'RlayTransform.arrayWithNestedObject.arrayWithNestedObject.id',
          'RlayTransform.arrayWithNestedObject.arrayWithNestedObject.value',
          'RlayTransform.arrayWithNestedObject.arrayWithNestedObject.value.subId',
          'RlayTransform.arrayWithNestedObject.arrayWithNestedObject.value.subValue',
          'RlayTransform.arrayWithNestedObject.arrayWithNestedObject.1',
          'RlayTransform.arrayWithNestedObject.arrayWithNestedObject.value.0'
        ],
        'arrayWithMixedElements': [
          'RlayTransform.arrayWithMixedElements',
          'RlayTransform.arrayWithMixedElements.arrayWithMixedElements.0',
          'RlayTransform.arrayWithMixedElements.arrayWithMixedElements.1',
          'RlayTransform.arrayWithMixedElements.arrayWithMixedElements.2',
          'RlayTransform.arrayWithMixedElements.arrayWithMixedElements',
          'RlayTransform.arrayWithMixedElements.arrayWithMixedElements.a',
          'RlayTransform.arrayWithMixedElements.arrayWithMixedElements.B'
        ],
        'arrayWithStrings': [
          'RlayTransform.arrayWithStrings',
          'RlayTransform.arrayWithStrings.arrayWithStrings.0',
          'RlayTransform.arrayWithStrings.arrayWithStrings.1',
          'RlayTransform.arrayWithStrings.arrayWithStrings.2',
          'RlayTransform.arrayWithStrings.arrayWithStrings.3'
        ],
        'arrayWithDuplicateObjects': [
          'RlayTransform.arrayWithDuplicateObjects',
          'RlayTransform.arrayWithDuplicateObjects.arrayWithDuplicateObjects.0',
          'RlayTransform.arrayWithDuplicateObjects.arrayWithDuplicateObjects',
          'RlayTransform.arrayWithDuplicateObjects.arrayWithDuplicateObjects.value',
          'RlayTransform.arrayWithDuplicateObjects.arrayWithDuplicateObjects.value.subId',
          'RlayTransform.arrayWithDuplicateObjects.arrayWithDuplicateObjects.1'
        ],
        'arrayEmpty': ['RlayTransform.arrayEmpty']
      }
    }
  },
  unordered: {
    getData: () => {
      return {
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
    },
    getEntityLength: () => {
      return {
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
        'arrayWithObject': 20,
        'arrayWithNestedObject': 27,
        'arrayWithMixedElements': 19,
        'arrayWithStrings': 10,
        'arrayWithDuplicateObjects': 19,
        'arrayEmpty': 4
      }
    }
  }
}
