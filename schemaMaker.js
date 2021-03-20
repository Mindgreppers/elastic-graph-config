import _ from 'lodash';
import toml from 'toml';
import fs from 'fs';
const x = process.argv[3];
import backendConfigMaker from '../elasticgraph/lib/configLoader/index.js';

const folderPath = process.argv[2]
const getConfig = (configFolderPath) => {
  const config = { //contain whole configuration of frontend
    entities: {},
    web: {}
  }

  setEntitiesConfig(config, configFolderPath + '/schema' + '/entities')
  setEntitiesFields(config, configFolderPath + '/web') //like primaryField
  setFrontentConfig(config, configFolderPath + '/schema/frontendConfig.toml')

  fs.writeFile(folderPath + '/frontend/config.js', 'export default ' + JSON.stringify(config), (err) => {
    if (err) {
      return console.log(err)
    }

    console.log('frontend config is saved')
  })

  return config
}

const setEntitiesConfig = (config, entitiesFolderPath) => {
  const files = fs.readdirSync(entitiesFolderPath)
  files.forEach((fileName) => {
    let et = fileName.split('.')[0]
    setJsonContentFromToml(config.entities, et, [entitiesFolderPath, fileName].join('/'))
  })
}

const setEntitiesFields = (config, entitiesFolderPath) => {
  const folders = fs.readdirSync(entitiesFolderPath)
  folders.forEach((folderName) => {
    config.web[folderName] = config.web[folderName] || {}
    const files = fs.readdirSync([entitiesFolderPath, folderName].join('/'))
    files.forEach((fileName) => {
      let et = fileName.split('.')[0]
      setJsonContentFromToml(config.web[folderName], et, [entitiesFolderPath, folderName, fileName].join('/'))
    })
  })
}

const setFrontentConfig = (config, path) => {

  setJsonContentFromToml(config, 'frontendConfig', path)
}

const setJsonContentFromToml = (config, key, filePath) => {

  const fileContent = fs.readFileSync(filePath)
  config[key] = toml.parse(fileContent)
}

const replacer = (key, value) => {

  if (value === String) {
    return 'string'
  }

  if (value === Number) {
    return 'number'
  }

  if (value === Date) {
    return 'date'
  }

  if (value === Boolean) {
    return 'boolean'
  }

  return value
}

getConfig(folderPath + '/frontend')

const backendConfig = backendConfigMaker(folderPath + '/backend')

fs.writeFile(folderPath + '/backendConfig.js', 'export default ' + JSON.stringify(backendConfig, replacer), (err) => {
  if (err) {
    console.log(err)
  }

  console.log('backendConfig is saved')
})
