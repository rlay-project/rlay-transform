const check = require('check-types');

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

  /**
   * Generate schema using
   */
  static toRlayEntities (client, prefix, json) {
    if (!prefix) throw new Error('@prefix needs to have a value');
    const pathRN = this._assignRlayTransformPrefix(prefix);
    this._initIndexMap();
    const arr = [];
    const properties = [];
    if (check.object(json)) {
      const objectKeys = Object.keys(json);
      // create classes for that object
      const cLabel  = this.generateLabel(client, pathRN);
      const c       = this.generateClass(client, cLabel);
      const ca      = this.generateClassAssertion(client, c);
      arr.push(...[cLabel, c, ca]);
      properties.push(ca);
      objectKeys.forEach(key => {
        const value = json[key];
        if (check.not.undefined(value)) {
          if (isStringable(value)) {
            // normal single value DataProperty
            const label = this.generateLabel(client, [...pathRN, key]);
            const dp    = this.generateDataProperty(client, label);
            const dpa   = this.generateDataPropertyAssertion(client, dp, value);
            arr.push(...[label, dp, dpa]);
            properties.push(dpa);
          } else if (check.array(value) &&
            check.nonEmptyArray(value) &&
            check.all(value.map(isStringable))) {
            // an array of single value DataProperties
            // note: this does not capture or preserve the order of the array's elements
            const label = this.generateLabel(client, [...pathRN, key]);
            const dp    = this.generateDataProperty(client, label);
            const dpas  = value.map(v => this.generateDataPropertyAssertion(client, dp, v));
            arr.push(...[label, dp, ...dpas]);
            properties.push(...dpas);
          } else if (check.object(value)) {
            // a single value ObjectProperty
            const entities = this.toRlayEntities(client, [...pathRN, key], value);
            const i     = entities.filter(e => e.type === 'Individual').shift();
            const label = this.generateLabel(client, [...pathRN, key]);
            const op    = this.generateObjectProperty(client, label);
            const opa   = this.generateObjectPropertyAssertion(client, op, i);
            arr.push(...[label, op, opa, ...entities]);
            properties.push(opa);
          } else if (check.array(value) &&
            check.nonEmptyArray(value) &&
            check.all(value.map(check.object.bind(check)))) {
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
          } else if (check.array(value) && check.nonEmptyArray(value)) {
            // an array with mixed elements (DataProperty/ObjectProperty)
            // note: this does not capture or preserve the order of the array's elements
            const label = this.generateLabel(client, [...pathRN, key]);
            const dp    = this.generateDataProperty(client, label);
            const op    = this.generateObjectProperty(client, label);
            const xpas  = value.map(v => {
              if (isStringable(v)) {
                return this.generateDataPropertyAssertion(client, dp, v);
              } else if (check.object(v)) {
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
