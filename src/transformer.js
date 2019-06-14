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
    return new client.Rlay_Annotation(
      client,
      client.Rlay_Annotation.prepareRlayFormat({
        property: client.rlay.builtins.labelAnnotationProperty,
        value: label
      }));
  }

  static generateDataProperty (client, labelAnnotation) {
    return new client.Rlay_DataProperty(
      client,
      client.Rlay_DataProperty.prepareRlayFormat({
        annotations: [labelAnnotation.cid]
      }));
  }

  static generateDataPropertyAssertion (client, dataProperty, target) {
    return new client.Rlay_DataPropertyAssertion(
      client,
      client.Rlay_DataPropertyAssertion.prepareRlayFormat({
        property: dataProperty.cid,
        target: client.rlay.encodeValue(target)
      }));
  }

  static generateObjectProperty (label, descripton) {

  }

  static generateClass (client, labelAnnotation) {
    return new client.Rlay_Class(
      client,
      client.Rlay_Class.prepareRlayFormat({
        annotations: [labelAnnotation.cid]
      }));
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

  /**
   * Generate schema using
   */
  static toRlayEntities (client, prefix, json) {
    if (!prefix) throw new Error('@prefix needs to have a value');
    const pathRN = this._assignRlayTransformPrefix(prefix);
    const arr = [];
    if (isArray(json) && isObjectArray(json)) return json.map(RlayTransformer.transform)
    if (isObject(json)) {
      const objectKeys = Object.keys(json);
      // create classes for that object
      const cLabel  = this.generateLabel(client, pathRN);
      const c       = this.generateClass(client, cLabel);
      const ca      = this.generateClassAssertion(client, c);
      arr.push(...[cLabel, c, ca]);
      objectKeys.forEach(key => {
        const value = json[key];
        if (!isEmpty(value)) {
          if (isStringable(value)) {
            const label = this.generateLabel(client, [...pathRN, key]);
            const dp    = this.generateDataProperty(client, label);
            const dpa   = this.generateDataPropertyAssertion(client, dp, value);
            arr.push(...[label, dp, dpa]);
          } else if (isArray(value) && isStringArray(value)) {
            arr.push([...pathRN, key]);
          } else if (isObject(value)) {
            arr.push([...pathRN, key]);
          } else if (isArray(value) && isObjectArray(value)) {
            arr.push([...pathRN, key]);
            arr.push(...RlayTransformer.transform(client, pathRN, value));
          }
        }
      });
      arr.push(this.generateIndividual(client, arr));
    }
    return arr;
  }

  static toRlayEntityObjects (client, prefix, json) {
    return this.fromEntitiesToRlayPayloads(this.toRlayEntities(client, prefix, json));
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
