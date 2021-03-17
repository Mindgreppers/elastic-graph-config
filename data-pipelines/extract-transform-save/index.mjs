import Debug from 'debug';
import ElasticGraph from 'elasticgraph';
import minimist from 'minimist';
import _ from 'lodash';

import csvDataExtractor from './csv-data-extractor.mjs';
import importConfig from './data_config.mjs';
import {setQuestionCountsInWorkshop, finalUserWorkshopCalculations} from './transcript_calculations.mjs';

const debug = new Debug('ETS:index');

var argv = minimist(process.argv.slice(2));

const es = new ElasticGraph(argv.configPath);

import {
    saveWorkshop,
    saveUsersStatesCitiesFromAICTE,
    saveWorkshopAttendancesAlongWithNonRegisteredUsers,
    saveDifferentGoogleForms,
    savePollData
} from './scripts.mjs';

console.time('ETL Time')

//Extract raw data from csvs and dump in the database
if (argv.extractRawData) {
    debug('Starting extraction of csv data into ElasticSearch');
    const workshopDataFolderPath = argv.workshopDataFolder;
    await csvDataExtractor(es, workshopDataFolderPath, importConfig.sources);
    debug('Finished extraction of csv data into ElasticSearch.');
};

if (argv.transformAndSave) {
    debug('Starting transformation of raw data and save in our schema');
    await es.runScripts([
      //saveWorkshop(argv.workshopId),
      //saveUsersStatesCitiesFromAICTE ('sample1'),
        //...saveWorkshopAttendancesAlongWithNonRegisteredUsers(argv.workshopId),
        
        //...savePollData(argv.workshopId),
      //setQuestionCountsInWorkshop(argv.workshopId),
        //...saveDifferentGoogleForms(argv.workshopId),
       finalUserWorkshopCalculations(argv.workshopId)
    ], 1000);
    debug('Saved transformed data. Please check database now, for data sanctity.');
};
console.timeEnd('ETL Time')
debug('Done!');