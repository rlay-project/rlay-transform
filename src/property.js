class Property {
  constructor (entity) {
    entity.$$transformType = 'property'
    return entity;
  }

  static check (entity) {
    return entity.$$transformType === 'property'
  }

  static remove (entity) {
    Reflect.deleteProperty(entity, '$$transformType');
  }
}

module.exports = { Property }
