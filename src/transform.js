const check = require('check-types');
const { Property } = require('./property');

function isStringable (value) {
  return check.string(value) || check.number(value) || check.boolean(value) ||
    check.null(value) || value.constructor === RegExp || check.date(value)
}

class RlayTransform {
  static generateLabel (client, pathRN) {
    const label = pathRN.join('.');
    const entity = client.Rlay_Annotation.from({
      property: client.rlay.builtins.labelAnnotationProperty,
      value: label
    });
    this.indexMap.set(label + '.LabelAnnotation', entity);
    return entity;
  }

  static generateDataProperty (client, labelAnnotation) {
    const label = client.rlay.decodeValue(labelAnnotation.payload.value);
    const entity = client.Rlay_DataProperty.from({
      annotations: [labelAnnotation.cid]
    });
    this.indexMap.set(label + '.DataProperty', entity);
    return entity;
  }

  static generateDataPropertyAssertion (client, dataProperty, target) {
    return client.Rlay_DataPropertyAssertion.from({
      property: dataProperty.cid,
      target: target
    });
  }

  static generateObjectProperty (client, labelAnnotation) {
    const label = client.rlay.decodeValue(labelAnnotation.payload.value);
    const entity = client.Rlay_ObjectProperty.from({
      annotations: [labelAnnotation.cid]
    });
    this.indexMap.set(label + '.ObjectProperty', entity);
    return entity;
  }

  static generateObjectPropertyAssertion (client, objectProperty, targetEntity) {
    return client.Rlay_ObjectPropertyAssertion.from({
      property: objectProperty.cid,
      target: targetEntity.cid
    });
  }

  static generateClass (client, labelAnnotation) {
    const label = client.rlay.decodeValue(labelAnnotation.payload.value);
    const entity = client.Rlay_Class.from({
      annotations: [labelAnnotation.cid]
    });
    this.indexMap.set(label + '.Class', entity);
    return entity;
  }

  static generateClassAssertion (client, c) {
    return client.Rlay_ClassAssertion.from({class: c.cid});
  }

  static generateIndividual (client, entities) {
    const getType = (entity, type) => entity.type === type
    const getTypeCA = entity => getType(entity, 'ClassAssertion')
    const getTypeOPA = entity => getType(entity, 'ObjectPropertyAssertion')
    const getTypeDPA = entity => getType(entity, 'DataPropertyAssertion')
    const getCid = entity => entity.cid
    return client.Rlay_Individual.from({
      class_assertions: entities.filter(getTypeCA).map(getCid),
      object_property_assertions: entities.filter(getTypeOPA).map(getCid),
      data_property_assertions: entities.filter(getTypeDPA).map(getCid)
    });
  }

  static generateClassTransformation (client, pathRN) {
    const cLabel = this.generateLabel(client, pathRN);
    const c = this.generateClass(client, cLabel);
    const ca = new Property(this.generateClassAssertion(client, c));
    return [cLabel, c, ca];
  }

  static generateDPTransformation (client, pathRN, value) {
    const label = this.generateLabel(client, pathRN);
    const dp = this.generateDataProperty(client, label);
    const dpa = new Property(this.generateDataPropertyAssertion(client, dp, value));
    return [label, dp, dpa];
  }

  static generateOPTransformation (client, pathRN, value) {
    // we do this so that the Class for that new Individual does not have an index
    // which happens when `attribute: [{object1], {object2}]`
    // which results in object1 and object2 each getting their own class with index
    let toRlayEntitiesPathRN = pathRN;
    if (check.number(pathRN.slice(-1).pop())) toRlayEntitiesPathRN = pathRN.slice(0, -1)
    const entities = this.toRlayEntities(client, toRlayEntitiesPathRN, value);
    const label = this.generateLabel(client, pathRN);
    const op = this.generateObjectProperty(client, label);
    // remove Property that don't belong to this Individual
    entities.forEach(Property.remove);
    const i = entities.filter(e => e.type === 'Individual').shift();
    const opa = new Property(this.generateObjectPropertyAssertion(client, op, i));
    return [label, op, opa, ...entities];
  }

  static _capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  static _getKeys (value) {
    if (check.array(value)) {
      return Array.from(new Set(...value.map(RlayTransform._getKeys)));
    }
    return Object.keys(value);
  }


  static _assignRlayTransformPrefix (prefix) {
    const RLAY_TRANSFORM_PREFIX = 'RlayTransform';
    // check that the prefix is an array already
    if (check.not.array(prefix)) return this._assignRlayTransformPrefix([prefix]);
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

  // deduplicate the array (even objects by stringifying them)
  static _deduplicateArray (array) {
    return [...new Set(array.map(s => JSON.stringify(s)))].map(s => JSON.parse(s));
  }

  // deduplicate
  static _deduplicatePayloads (payloads) {
    const map = new Map();
    return payloads.filter(payload => {
      if (map.has(payload.cid)) return false
      map.set(payload.cid, true)
      return true
    });
  }

  static toUnorderedJson (json) {
    if (check.not.object(json)) throw new Error('input json must be an object');
    const objectKeys = Object.keys(json);
    objectKeys.forEach(key => {
      const value = json[key];
      if (check.array(value)) {
        json[key] = this._deduplicateArray(value);
        // check downstream for more array to unorder
        json[key].forEach((v, i) => {
          if (check.object(v)) json[key][i] = this.toUnorderedJson(v);
        });
        json[key] = new Set(json[key]);
      }
      if (check.object(value)) json[key] = this.toUnorderedJson(value);
    });
    return json
  }

  /**
   * Generate schema using
   */
  static toRlayEntities (client, prefix, json) {
    if (!prefix) throw new Error('@prefix needs to have a value');
    const pathRN = this._assignRlayTransformPrefix(prefix);
    this._initIndexMap();
    const arr = [];
    if (check.object(json)) {
      const objectKeys = Object.keys(json);
      // create classes for that object
      arr.push(...this.generateClassTransformation(client, pathRN));
      objectKeys.forEach(key => {
        const value = json[key];
        if (check.not.undefined(value)) {
          if (isStringable(value)) {
            // normal single value DataProperty
            arr.push(...this.generateDPTransformation(client, [...pathRN, key], value));
          } else if (check.object(value)) {
            // a single value ObjectProperty
            arr.push(...this.generateOPTransformation(client, [...pathRN, key], value));
          } else if (check.array(value) && check.nonEmptyArray(value)) {
            // an array, might have mixed elements (DataProperty/ObjectProperty)
            // note: this does capture and preserve the order of the array's elements
            arr.push(...this._deduplicatePayloads(value.
              filter(v => isStringable(v) || check.object(v)).
              map((v, i) => {
                if (isStringable(v)) {
                  return this.generateDPTransformation(client, [...pathRN, key, i], v);
                }
                return this.generateOPTransformation(client, [...pathRN, key, i], v);
              }).
              reduce((all, one) => [...all, ...one], []))
            );
          } else if (value instanceof Set) {
            // a set, might have mixed elements (DataProperty/ObjectProperty)
            // note: this does not capture and preserve the order of the set's elements
            arr.push(...this._deduplicatePayloads(Array.from(value).
              filter(v => isStringable(v) || check.object(v)).
              map(v => {
                if (isStringable(v)) {
                  return this.generateDPTransformation(client, [...pathRN, key], v)
                }
                return this.generateOPTransformation(client, [...pathRN, key], v);
              }).
              reduce((all, one) => [...all, ...one], []))
            );
          }
        }
      });
      arr.push(this.generateIndividual(client, arr.filter(Property.check)));
    }
    return arr;
  }

  static toRlayEntityObjects (client, prefix, json) {
    return this.toRlayEntities(client, prefix, json).map(entity => entity.payload);
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

  static set schemaCmds (cmds) {
    this._schemaCmds = cmds;
  }

  static get schemaCmds () {
    return this._schemaCmds;
  }
}

module.exports = RlayTransform;
