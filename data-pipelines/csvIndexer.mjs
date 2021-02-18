import Fs from 'fs';
import CsvReadableStream from 'csv-reader';

/**
 * 
 * @param {*} client ElasticGraph client
 * @param {*} filePath path of the csv file
 * @param {*} additionalKeyValuePairs to be inserted in every row
 */
export const indexCsv = async (egClient, filePath, indexName, additionalKeyValuePairs = {}, surveyOptions) => {
    await ensureIndexExists(egClient, indexName);
    console.log('csvIndexer: starting to index', indexName);
    return new Promise((resolve, reject) => {
        //indexData called resolve() when the whole file is processed
        indexData(resolve, egClient, filePath, indexName, additionalKeyValuePairs, surveyOptions);
    })
};

const ensureIndexExists = async (egClient, indexName) => {
    const { body } = await egClient.indices.exists({
        index: indexName
    });
 
    //ES returns true or false in the body
    if (body) {
        return;
    }

    await egClient.indices.create({
        index: indexName,
        body: {
            "mappings": {
              "date_detection": false,
              "numeric_detection": false
            }
          }
      })
}

const indexData = (resolve, client, filePath, indexName, additionalKeyValuePairs, surveyOptions ) => {
    let inputStream = Fs.createReadStream(filePath, 'utf8');

    let handled = 0
    let encountered = 0
    let erroredOut = 0
    let allRowsParsed = false
    console.time('duration')

    inputStream
        .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true, delimiter: ";", asObject: true }))
        .on('data', (row) => {
            sanitizeRow(row, surveyOptions)
            if (additionalKeyValuePairs) {
                row = {...row, ...additionalKeyValuePairs};
            }
            
            if (!Object.keys(row).length) {
                return
            }
            encountered++
            client.index.collect({
                    index: indexName,
                    body: row
                })
                .catch((e) => {
                    erroredOut++
                    console.log('Found error in indexing', e, row)
                })
                .then(() => {
                    handled++
                    if (allRowsParsed && handled === encountered) {
                        console.timeEnd('duration')
                        console.log(`Parsed rows ${handled}. Errored out ${erroredOut}`)
                        resolve();
                    }
                })
        })
        .on('end', function(data) {
            console.log('No more rows!');
            allRowsParsed = true
            
        });
}

function isEmptyRow(row) {
    const values = Object.values(row)
    if (values.join('') === '') {
        return true
    }
    return false
}

function sanitizeRow(row, {numericalColumns, includedColumns}) {
    Object.keys(row).forEach((columnName) => {
        
        if (includedColumns && !includedColumns.includes(columnName)) {
            delete row[columnName];
            return;
        }

        if (columnName === '' || row[columnName] === '') {
            delete row[columnName];
            return;
        }
        try {
            if (row[columnName] === '--' || row[columnName] === '-') {
                delete row[columnName];
                return;
            }
            
            //Remove prefix of ' if found
            if (row[columnName][0] === "'") { // ' followed by number
                row[columnName] = row[columnName].substr(1);
            }
            if (columnName === 'havefaculty_id') {
                //console.log('d')
            }
            //Parse numerical values
            if (numericalColumns && numericalColumns.includes(columnName)) {
                if (+row[columnName]) {
                    row[columnName] = +row[columnName];
                } else {
                    delete row[columnName];
                    return;
                }
            } else {
                row[columnName] = row[columnName] + "";
            }

            if (columnName.indexOf('Time') > 0) {
                row[columnName] = new Date(row[columnName]).getTime();
            }
        } catch (e) {
            console.log('Error in sanitizing the row', e)
        }
    })
}

import config from './extract-transform-save/data_config.mjs'
import ElasticGraph from 'elasticgraph';
const es = new ElasticGraph(process.argv[2]);

const indexCycles = async (numCycles) => {
    await indexCsv(es, "/media/ayush/52A85AD0A85AB1E9/Users/ayush/work/elasticcms/elastic-graph-config/data-pipelines/workshop_sample1/from_AICTE/semi-processed/registration.csv", 'aicte_registrations', {workshopCode: "sample_1"}, config.sources.aicte.registrations);
    if (numCycles > 0) {
        await indexCycles (numCycles -1)
    };
};

indexCycles(100, )