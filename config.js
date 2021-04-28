import _ from 'lodash';
import fs from 'fs';
let webconfig = fs.readFileSync('./frontend/config.json');
webconfig = JSON.parse(webconfig);

let backendConfig = fs.readFileSync('./backendConfig.json');
backendConfig = JSON.parse(backendConfig);

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
export default backendConfig
