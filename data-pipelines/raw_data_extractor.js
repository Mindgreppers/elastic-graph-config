import ElasticGraph from 'elasticgraph';
import {indexCsv} from './csvIndexer.mjs';
import fs from 'fs';

import config from './config';

const extractRawDataInES = async (egClient, workshopDataFolderPath) => {
    const dataFolderPathArray = workshopDataFolderPath.split('/');
    //The folder name of workshop is expected to be named workshop_{{code}} where code is workshop's code by AICTE
    let workshopCode = dataFolderPathArray[dataFolderPathArray.length -1]; //last element of the array
    //Code is stored in the name after workshop_{code}
    workshopCode = workshopCode.split('_')[1]

    // const registrationDataFilePath = [process.cwd(), workshopDataFolderPath, 'from_AICTE', 'semi-processed', 'registration.csv'].join('/');
    // await extractRegistrations(egClient, workshopCode, registrationDataFilePath);

    // const surveyDataFolderPath = [process.cwd(), workshopDataFolderPath, 'from_Google_Forms', 'semi-processed'].join('/');
    // await extractSurveysEtc(egClient, workshopCode, surveyDataFolderPath);

    const attendateAndPollDataFolderPath = [process.cwd(), workshopDataFolderPath, 'from_Zoom', 'semi-processed'].join('/'); 
    await extractAttendanceAndPollsData (egClient, workshopCode, attendateAndPollDataFolderPath);
}

const extractRegistrations = async (egClient, workshopCode, registrationCsvPath) => {
    await indexCsv(egClient, registrationCsvPath, 'raw_registrations', {workshopCode}, config.sources.aicte.registrations);
};

const extractSurveysEtc = async (egClient, workshopCode, surveysFolderPath) => {
    const fileNames = fs.readdirSync(surveysFolderPath);
    const indexingPromises = fileNames.map((fileName) => {
        const fullFilePath = `${surveysFolderPath}/${fileName}`;
        //Extract indexName from {{indexName}}.csv
        const indexName = fileName.split('.')[0];
        return indexCsv(egClient, fullFilePath, indexName, {workshopCode}, config.sources.googleForms);
    });
    return Promise.all(indexingPromises);
};  

const extractAttendanceAndPollsData = async (egClient, workshopCode, attendateAndPollDataFolderPath) => {

};

var egClient = new ElasticGraph(process.argv[2]);
const dataDirectory = process.argv[3];
extractRawDataInES(egClient, dataDirectory)
.then(() => console.log('done'))
.catch(console.log);