import fs from 'fs';

import config from './data_config.mjs';
import minimist from 'minimist';

var argv = minimist(process.argv.slice(2));

/**
 * 
 * @param egClient 
 * @param workshopDataFolderPath the folder in which the AICTE, google forms and zoom csvs are present.
 * @param {aicte, googleForms, zoom} the configs for import of their data respectively.
 */
export default async (egClient, workshopDataFolderPath, {aicte, googleForms, zoom}) => {
    const dataFolderPathArray = workshopDataFolderPath.split('/');
    //The folder name of workshop is expected to be named workshop_{{code}} where code is workshop's code by AICTE
    let workshopCode = dataFolderPathArray[dataFolderPathArray.length -1]; //last element of the array
    //Code is stored in the name after workshop_{code}
    workshopCode = workshopCode.split('_')[1]

    if (argv.aicte) {
        const registrationDataFilePath = [process.cwd(), workshopDataFolderPath, 'from_AICTE', 'semi-processed', 'registration.csv'].join('/');
        console.time('Extracting registration data from AICTE');
        await egClient.indexCsv(registrationDataFilePath, 'aicte_registrations', {workshopCode}, config.sources.aicte.registrations);
        console.timeEnd('Extracting registration data from AICTE');
    }
    if (argv.googleForms) {
        console.time('Extracting survey data from Google Forms')
        const surveyDataFolderPath = [process.cwd(), workshopDataFolderPath, 'from_Google_Forms', 'semi-processed'].join('/');
        await extractCsvFolder(egClient, workshopCode, surveyDataFolderPath, config.sources.googleForms);
        console.timeEnd('Extracting survey data from Google Forms');
    }
    if (argv.zoom) {
        console.time('Extracting attendance and poll data');
        const attendateAndPollDataFolderPath = [process.cwd(), workshopDataFolderPath, 'from_Zoom', 'semi-processed'].join('/'); 
        const x = await extractCsvFolder(egClient, workshopCode, attendateAndPollDataFolderPath, config.sources.zoom);
        console.timeEnd('Extracting attendance and poll data')
    }

    if (argv.quizKey) {
        console.time('Extracting quiz_key data');
        const quizKeyFilePath = [process.cwd(), workshopDataFolderPath, 'quiz_key.csv'].join('/'); 
        await egClient.indexCsv(quizKeyFilePath, 'quiz_keys');
        console.time('Extracting quiz_key data');
    }
};


/**
 * 
 * @param egClient         Elasticgraph client.
 * @param workshopCode     The code of the workshop as recieved from AICTE.
 * @param csvFolderPath    The folder containing the csv files to index. 
 *                         Each file will be saved in a table with same name as the file, without the .csv extension.
 * @param dataSourceConfig has includeFields and numericalFields list. They can be empty if not used.
 *                         If only a few fields from a csv are to be imported, includeFields list can be set.
 *                         If there is some field which is to be treated as numerical field, then set here. 
 *                         By default all fields are treated to be string fields.
 */
const extractCsvFolder = async (egClient, workshopCode, csvFolderPath, dataSourceConfig) => {
    const fileNames = fs.readdirSync(csvFolderPath);
    const indexingPromise = fileNames.reduce(async (promiseSoFar, fileName) => {
        const fullFilePath = `${csvFolderPath}/${fileName}`;
        //Extract indexName from {{indexName}}.csv
        const indexName = fileName.split('.')[0];
        return promiseSoFar
        .then(async () => {
            await sleep(2000);
            return egClient.indexCsv(fullFilePath, indexName, {workshopCode}, dataSourceConfig);
        })
    }, Promise.resolve());
    return indexingPromise;
};  

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// //Test this.
// var egClient = new ElasticGraph(process.argv[2]);
// const dataDirectory = process.argv[3];
// extractRawDataInES(egClient, dataDirectory, {aicte: 1, zoom: 0, googleForms: 0})
// .then(() => console.log('done'))
// .catch(console.log);