// BASE
function isString (value) {
  return typeof value === 'string' || value instanceof String;
}

function isNumber (value) {
  return typeof value === 'number' && isFinite(value);
}

function isArray (value) {
  return value && typeof value === 'object' && value.constructor === Array;
}

function isObject (value) {
  return value && typeof value === 'object' && value.constructor === Object;
}

function isNull (value) {
  return value === null;
}

function isUndefined (value) {
  return typeof value === 'undefined';
}

function isBoolean (value) {
  return typeof value === 'boolean';
}

// COMPLEX

function isEmptyObject (value) {
  return isObject(value) && Object.keys(value).length === 0 && value.constructor === Object
}

function isEmptyArray (value) {
  return isArray(value) && value.length === 0
}

function isObjectArray (value) {
  return !isEmptyArray(value) && value.every(isObject);
}

function isStringArray (value) {
  return !isEmptyArray(value) && value.every(isStringable);
}

function isEmpty (value) {
  return isUndefined(value) || isEmptyObject(value) || isEmptyArray(value)
}

function isStringable (value) {
  return isString(value) || isNumber(value) || isBoolean(value) || isNull(value)
}


class RlayTransformer {
  static generateLabel (client, pathRN) {
    const label = pathRN.join('.');
    const entity = new client.Rlay_Annotation(
      client,
      client.Rlay_Annotation.prepareRlayFormat({
        property: client.rlay.builtins.labelAnnotationProperty,
        value: label
      }));
    this.indexMap.set(label + '.LabelAnnotation', entity);
    return entity;
  }

  static generateDataProperty (client, labelAnnotation) {
    const label = client.rlay.decodeValue(labelAnnotation.payload.value);
    const entity = new client.Rlay_DataProperty(
      client,
      client.Rlay_DataProperty.prepareRlayFormat({
        annotations: [labelAnnotation.cid]
      }));
    this.indexMap.set(label + '.DataProperty', entity);
    return entity;
  }

  static generateDataPropertyAssertion (client, dataProperty, target) {
    return new client.Rlay_DataPropertyAssertion(
      client,
      client.Rlay_DataPropertyAssertion.prepareRlayFormat({
        property: dataProperty.cid,
        target: client.rlay.encodeValue(target)
      }));
  }

  static generateObjectProperty (client, labelAnnotation) {
    const label = client.rlay.decodeValue(labelAnnotation.payload.value);
    const entity = new client.Rlay_ObjectProperty(
      client,
      client.Rlay_ObjectProperty.prepareRlayFormat({
        annotations: [labelAnnotation.cid]
      }));
    this.indexMap.set(label + '.ObjectProperty', entity);
    return entity;
  }

  static generateObjectPropertyAssertion (client, objectProperty, targetEntity) {
    return new client.Rlay_ObjectPropertyAssertion(
      client,
      client.Rlay_ObjectPropertyAssertion.prepareRlayFormat({
        property: objectProperty.cid,
        target: targetEntity.cid
      }));
  }

  static generateClass (client, labelAnnotation) {
    const label = client.rlay.decodeValue(labelAnnotation.payload.value);
    const entity = new client.Rlay_Class(
      client,
      client.Rlay_Class.prepareRlayFormat({
        annotations: [labelAnnotation.cid]
      }));
    this.indexMap.set(label + '.Class', entity);
    return entity;
  }

  static generateClassAssertion (client, c) {
    return new client.Rlay_ClassAssertion(
      client,
      client.Rlay_ClassAssertion.prepareRlayFormat({
        class: c.cid
      }));
  }

  static generateIndividual (client, entities) {
    const getType = (entity, type) => entity.type === type
    const getTypeCA = entity => getType(entity, 'ClassAssertion')
    const getTypeOPA = entity => getType(entity, 'ObjectPropertyAssertion')
    const getTypeDPA = entity => getType(entity, 'DataPropertyAssertion')
    const getCid = entity => entity.cid
    return new client.Rlay_Individual(
      client,
      client.Rlay_Individual.prepareRlayFormat({
        class_assertions: entities.filter(getTypeCA).map(getCid),
        object_property_assertions: entities.filter(getTypeOPA).map(getCid),
        data_property_assertions: entities.filter(getTypeDPA).map(getCid)
      }));
  }

  static _capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  static _getKeys (value) {
    if (isArray(value)) {
      return Array.from(new Set(...value.map(RlayTransformer._getKeys)));
    }
    return Object.keys(value);
  }


  static _assignRlayTransformPrefix (prefix) {
    const RLAY_TRANSFORM_PREFIX = 'RlayTransform';
    // check that the prefix is an array already
    if (!isArray(prefix)) return this._assignRlayTransformPrefix([prefix]);
    // check if it has the Rlay Transform Prefix already
    if (prefix[0] === RLAY_TRANSFORM_PREFIX) {
      // ok, return it as is
      return prefix;
    }
    return [RLAY_TRANSFORM_PREFIX, ...prefix];
  }

  static _initIndexMap () {
    if (!this.indexMap) this.indexMap = new Map();
  }

  /**
   * Generate schema using
   */
  static toRlayEntities (client, prefix, json) {
    if (!prefix) throw new Error('@prefix needs to have a value');
    const pathRN = this._assignRlayTransformPrefix(prefix);
    this._initIndexMap();
    const arr = [];
    const properties = [];
    if (isObject(json)) {
      const objectKeys = Object.keys(json);
      // create classes for that object
      const cLabel  = this.generateLabel(client, pathRN);
      const c       = this.generateClass(client, cLabel);
      const ca      = this.generateClassAssertion(client, c);
      arr.push(...[cLabel, c, ca]);
      properties.push(ca);
      objectKeys.forEach(key => {
        const value = json[key];
        if (!isEmpty(value)) {
          if (isStringable(value)) {
            // normal single value DataProperty
            const label = this.generateLabel(client, [...pathRN, key]);
            const dp    = this.generateDataProperty(client, label);
            const dpa   = this.generateDataPropertyAssertion(client, dp, value);
            arr.push(...[label, dp, dpa]);
            properties.push(dpa);
          } else if (isArray(value) && isStringArray(value)) {
            // an array of single value DataProperties
            // note: this does not capture or preserve the order of the array's elements
            const label = this.generateLabel(client, [...pathRN, key]);
            const dp    = this.generateDataProperty(client, label);
            const dpas  = value.map(v => this.generateDataPropertyAssertion(client, dp, v));
            arr.push(...[label, dp, ...dpas]);
            properties.push(...dpas);
          } else if (isObject(value)) {
            // a single value ObjectProperty
            const entities = this.toRlayEntities(client, [...pathRN, key], value);
            const i     = entities.filter(e => e.type === 'Individual').shift();
            const label = this.generateLabel(client, [...pathRN, key]);
            const op    = this.generateObjectProperty(client, label);
            const opa   = this.generateObjectPropertyAssertion(client, op, i);
            arr.push(...[label, op, opa, ...entities]);
            properties.push(opa);
          } else if (isArray(value) && isObjectArray(value)) {
            // an array of single value ObjectProperties
            // note: this does not capture or preserve the order of the array's elements
            const label = this.generateLabel(client, [...pathRN, key]);
            const op    = this.generateObjectProperty(client, label);
            const opas  = value.map(v => {
              const entities = this.toRlayEntities(client, [...pathRN, key], v);
              const i   = entities.filter(e => e.type === 'Individual').shift();
              arr.push(...entities);
              return this.generateObjectPropertyAssertion(client, op, i);
            });
            arr.push(...[label, op, ...opas]);
            properties.push(...opas);
          } else if (isArray(value)) {
            // an array with mixed elements (DataProperty/ObjectProperty)
            // note: this does not capture or preserve the order of the array's elements
            const label = this.generateLabel(client, [...pathRN, key]);
            const dp    = this.generateDataProperty(client, label);
            const op    = this.generateObjectProperty(client, label);
            const xpas  = value.map(v => {
              if (isStringable(v)) {
                return this.generateDataPropertyAssertion(client, dp, v);
              } else if (isObject(v)) {
                const entities = this.toRlayEntities(client, [...pathRN, key], v);
                const i   = entities.filter(e => e.type === 'Individual').shift();
                arr.push(...entities);
                return this.generateObjectPropertyAssertion(client, op, i);
              }
            });
            arr.push(...[label, dp, op, ...xpas]);
            properties.push(...xpas);
          }
        }
      });
      arr.push(this.generateIndividual(client, properties));
    }
    return arr;
  }

  static toRlayEntityObjects (client, prefix, json) {
    return this.fromEntitiesToRlayPayloads(this.toRlayEntities(client, prefix, json));
  }

  static getRlaySchemaCidIndex () {
    const index = {};
    Array.from(this.indexMap).forEach(set => {
      index[set[0]] = set[1].cid;
    });
    return index;
  }

  static getRlaySchemaObjectIndex () {
    return Array.from(this.indexMap).map(set => {
      return {
        key: set[0],
        assertion: set[1].payload,
      };
    });
  }

  static fromEntitiesToRlayPayloads (entities) {
    return entities.map(entity => entity.payload);
  }

  static set schemaCmds (cmds) {
    this._schemaCmds = cmds;
  }

  static get schemaCmds () {
    return this._schemaCmds;
  }
}

module.exports = RlayTransformer;
