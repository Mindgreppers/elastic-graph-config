import Fs from 'fs';
import CsvReadableStream from 'csv-reader';

/**
 * 
 * @param {*} client ElasticGraph client
 * @param {*} filePath path of the csv file
 * @param {*} additionalKeyValuePairs to be inserted in every row
 */
export const indexCsv = async (egClient, filePath, indexName, additionalKeyValuePairs = {}, numericalRows) => {
    await ensureIndexExists(egClient, indexName);
    return new Promise((resolve, reject) => {
        indexData(resolve, egClient, filePath, indexName, additionalKeyValuePairs, numericalRows);
    });
};

const ensureIndexExists = async (egClient, indexName) => {
    console.log()
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

const indexData = (resolve, client, filePath, indexName, additionalKeyValuePairs, numericalColumns ) => {
    let inputStream = Fs.createReadStream(filePath, 'utf8');

    let handled = 0
    let encountered = 0
    let erroredOut = 0
    let allRowsParsed = false
    console.time('duration')

    inputStream
        .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true, delimiter: ";", asObject: true }))
        .on('data', async function(row) {
            sanitizeRow(row, {numericalColumns})
            if (additionalKeyValuePairs) {
                row = {...row, ...additionalKeyValuePairs};
            }
            
            if (!Object.keys(row).length) {
                return
            }
            encountered++
            await client.index.collect({
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
                    }
                })
        })
        .on('end', function(data) {
            console.log('No more rows!');
            allRowsParsed = true
            resolve();
        });
}

function isEmptyRow(row) {
    const values = Object.values(row)
    if (values.join('') === '') {
        return true
    }
    return false
}

function sanitizeRow(row, {numericalColumns}) {
    Object.keys(row).forEach((columnName) => {
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
            if (numericalColumns.includes(columnName)) {
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