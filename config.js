const _ = require('lodash')

const webconfig = require('./frontend/config.json')
let backendConfig = require('./backendConfig.json')

let schema = backendConfig.schema

let newConfig = _.reduce(schema, (newSchema, entity, entityKey) => {
  const keys = _.keys(entity)
  let entityInWebConfig = webconfig.entities[entityKey]
  let existingFieldInWebConfig = {}
  if (entityInWebConfig) {
    existingFieldInWebConfig = _.pick(entityInWebConfig, keys)
  }
  newSchema[entityKey] = _.merge(existingFieldInWebConfig, entity)

  return newSchema

}, {})

backendConfig.schema = newConfig
backendConfig.web = webconfig.web
backendConfig.frontendConfig = webconfig.frontendConfig
console.log(JSON.stringify(backendConfig))
module.exports = backendConfig
