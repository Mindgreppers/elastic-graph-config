import ElasticGraph from 'elasticgraph';
import {indexCsv} from './csvIndexer.mjs';
import fs from 'fs';

import config from './data_config.mjs';

const extractRawDataInES = async (egClient, workshopDataFolderPath) => {
    const dataFolderPathArray = workshopDataFolderPath.split('/');
    //The folder name of workshop is expected to be named workshop_{{code}} where code is workshop's code by AICTE
    let workshopCode = dataFolderPathArray[dataFolderPathArray.length -1]; //last element of the array
    //Code is stored in the name after workshop_{code}
    workshopCode = workshopCode.split('_')[1]

    const registrationDataFilePath = [process.cwd(), workshopDataFolderPath, 'from_AICTE', 'semi-processed', 'registration.csv'].join('/');
    console.time('Extracting registration data from AICTE');
    await extractRegistrations(egClient, workshopCode, registrationDataFilePath);
    console.timeEnd('Extracting registration data from AICTE');

    console.time('Extracting survey data from Google Forms')
    const surveyDataFolderPath = [process.cwd(), workshopDataFolderPath, 'from_Google_Forms', 'semi-processed'].join('/');
    await extractSurveysEtc(egClient, workshopCode, surveyDataFolderPath);
    console.timeEnd('Extracting survey data from Google Forms');

    console.time('Extracting attendance and poll data');
    const attendateAndPollDataFolderPath = [process.cwd(), workshopDataFolderPath, 'from_Zoom', 'semi-processed'].join('/'); 
    const x = await extractAttendanceAndPollsData (egClient, workshopCode, attendateAndPollDataFolderPath);
    console.timeEnd('Extracting attendance and poll data');

    console.time('Extracting attendance and poll data');
    const quizKeyPath = [process.cwd(), workshopDataFolderPath, 'quiz_key.csv'];
    await extractQuizKeys(egClient, quizKeyPath);
    console.timeEnd('Extracting attendance and poll data');
}
const extractRegistrations = async (egClient, workshopCode, registrationCsvPath) => {
    await egClient.indexCsv(registrationCsvPath, 'raw_registrations', {workshopCode}, config.sources.aicte.registrations);
};

const extractQuizKeys = async (egClient, workshopCode, quizKeyCsvPath) => {
    await egClient.indexCsv(quizKeyCsvPath, 'quiz_key');
};

const extractSurveysEtc = async (egClient, workshopCode, surveysFolderPath) => {
    const fileNames = fs.readdirSync(surveysFolderPath);
    const indexingPromise = fileNames.reduce(async (promiseSoFar, fileName) => {
        const fullFilePath = `${surveysFolderPath}/${fileName}`;
        //Extract indexName from {{indexName}}.csv
        const indexName = fileName.split('.')[0];
        return promiseSoFar
        .then(async () => {
            await sleep(2000);
            return indexCsv(egClient, fullFilePath, indexName, {workshopCode}, config.sources.googleForms);
        })
    }, Promise.resolve());
    return indexingPromise;
};  

const extractAttendanceAndPollsData = async (egClient, workshopCode, attendateAndPollDataFolderPath) => {
    const fileNames = fs.readdirSync(attendateAndPollDataFolderPath);
    const indexingPromise = fileNames.reduce(async (promiseSoFar, fileName) => {
        const fullFilePath = `${attendateAndPollDataFolderPath}/${fileName}`;
        //Extract indexName from {{indexName}}.csv
        const indexName = fileName.split('.')[0];
        return promiseSoFar.then(async () => {
            await sleep(2000);
            return indexCsv(egClient, fullFilePath, indexName, {workshopCode}, config.sources.zoom);
        });
    }, Promise.resolve());
    return indexingPromise;
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var egClient = new ElasticGraph(process.argv[2]);
const dataDirectory = process.argv[3];
extractRawDataInES(egClient, dataDirectory)
.then(() => console.log('done'))
.catch(console.log);