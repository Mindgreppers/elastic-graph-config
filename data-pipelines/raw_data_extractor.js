import ElasticGraph from 'elasticgraph';
import {indexCsv} from './csvIndexer.mjs';

const extractRawDataInES = async (egClient, workshopDataFolderPath) => {
    const dataFolderPathArray = workshopDataFolderPath.split('/');
    //The folder name of workshop is expected to be named workshop_{{code}} where code is workshop's code by AICTE
    let workshopCode = dataFolderPathArray[dataFolderPathArray.length -1]; //last element of the array
    //Code is stored in the name after workshop_{code}
    workshopCode = workshopCode.split('_')[1]

    const registrationDataFilePath = [process.cwd(), workshopDataFolderPath, 'from_AICTE', 'semi-processed', 'registration.csv'].join('/');
    await extractRegistrations(egClient, workshopCode, registrationDataFilePath);

    //await extractSurveysEtc(workshopCode, workshopDataFolderPath);
    //await extractAttendanceAndPollsData (workshopCode, workshopDataFolderPath);
}

const REGISTRATIONS_NUMERICAL_COLUMNS = ['candidateMobilenumber'];
const extractRegistrations = async (egClient, workshopCode, registrationCsvPath) => {
    await indexCsv(egClient, registrationCsvPath, 'raw_registrations', {workshopCode}, REGISTRATIONS_NUMERICAL_COLUMNS);
};

var egClient = new ElasticGraph(process.argv[2]);
const dataDirectory = process.argv[3];
extractRawDataInES(egClient, dataDirectory)
.then(() => console.log('done'))
.catch(console.log);