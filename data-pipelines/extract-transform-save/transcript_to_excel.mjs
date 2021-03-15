import fs from 'fs';
import ElasticGraph from 'elasticgraph';
import minimist from 'minimist';

var argv = minimist(process.argv.slice(2));
const es = new ElasticGraph(argv.configPath);

import {get} from './utils.mjs';
import config from './data_config.mjs';
const TRANSCRIPT_COLUMNS = config.transcriptColumns.join(',');
const QUIZ_PERFORMANCE_COLUMNS = config.quizPerformanceColumns.join(',');
const POST_WORKSHOP_SURVEY = config.sources.googleForms.postWorkshopSurvey;
const PRE_WORKSHOP_SURVEY = config.sources.googleForms.preWorkshopSurvey;

const NA = 'N/A';
const NO = 'NO';

export default async (workshopCode, filePath) => {
    //Write transcript sheet headers
    const transcriptFile = fs.createWriteStream(filePath, { flags: 'a' });
    transcriptFile.write(TRANSCRIPT_COLUMNS + '\n');
    
    //Write quiz performance sheet headers
    // const quizPerformanceFile = fs.createWriteStream('./quiz_performance.csv', { flags: 'a' });
    // const firstTwoRowsStr = generateQPFirstTwoRows(workshopCode);
    // transcriptFile.write(firstTwoRowsStr + '\n');
    // transcriptFile.write(QUIZ_PERFORMANCE_COLUMNS + '\n');

    //Now fill the rows
    const script = [
        `get workshop ${workshopCode} as workshop.`,
        `iterate over user-workshops where {workshop._id: ${workshopCode}} as user-workshop. Get 200 at a time. Flush every 3 cycles. Wait for 500 millis.`, [
            'get user *user-workshop.user._id. Join from read',
            (ctx) => {
                const row = generateRow(ctx);
                transcriptFile.write(row.join(',') + '\n');
                // const quizPerformanceRow = generateQPRow(ctx);
                // quizPerformanceFile.write(quizPerformanceRow.join(',') + '\n');
            }
        ],
        (ctx) => {
            transcriptFile.end();
            // quizPerformanceFile.end();
        }
    ];
 
    return await es.dsl.execute(script);
}

const generateRow = (ctx) => {
    const row = [];
    const user = ctx.get('user')._source;
    const userWorkshop = ctx.get('user-workshop')._source;
    //Email
    row.push(user.emailId);
    //Salutation
    row.push(NA)
    //Name as Registered
    row.push(user.firstName + user.lastName || NA);
    //designation
    row.push(NA);
    //Institute Name
    row.push(NA);
    //City
    row.push(get(user, ['city', 'fields', 'name']) || NA);
    //Phone
    row.push(user.contactNumber);

    //Now fill attendance and poll percentages, day wise
    
    for (let dayN of config.workshopDays) {
        //Day N Att
        const connectTimePercentage = get(userWorkshop, ['connectTime', dayN, 'percentageAttendance']);
        row.push(connectTimePercentage || 0);
        //Day N Poll
        const pollPercentage = get(userWorkshop, ['quizPerformance', 'aggregated', 'percentagePollsAttempted', dayN])
        row.push(pollPercentage || 0);
    }

    //Pre-wksp Survey
    row.push(get(userWorkshop, ['surveySumbissions', PRE_WORKSHOP_SURVEY]) || 0);	
    //Post wksp survey
    row.push(get(userWorkshop, ['surveySumbissions', POST_WORKSHOP_SURVEY]) || 0);
    //Post wksp feedback form (Same as postworkshop survey)
    row.push(get(userWorkshop, ['surveySumbissions', POST_WORKSHOP_SURVEY]) || NO);
    //Assignment N
    let numSubmittedAssignments = 0;
    for (let i = 1; i <= 4; i++) {
        const dayNAssignmentScore = get(userWorkshop, ['assignments', `workshop_assignment_day_${i}_responses`]) || 0;
        if (dayNAssignmentScore) {
            numSubmittedAssignments++;
        }
        row.push(dayNAssignmentScore);
    }
    //Rating of FDP : Content
    row.push(0);	
    //Rating of FDP : Process
    row.push(0);	
    //Rating of FDP : Facilitator(s)
    row.push(0);	
    //Rating of organisation of FDP : Communication (before FDP)
    row.push(0);
    //Rating of organisation of FDP : Communication (after FDP)
    row.push(0);
    //% Connect Time
    row.push(get(userWorkshop, ['connectTime', 'averagePercentageConnectTime']) || 0);
    //% Attended
    row.push(get(userWorkshop, ['connectTime', 'finalCalculatedConnectTimePercentage']) || 0);
    //Polls Participated
    row.push(get(userWorkshop, ['quizPerformance', 'aggregated', 'averageOfDailyPollAttemptPercentages'] || 0));
    //No. of Submitted Assignments
    row.push(numSubmittedAssignments);
    //Pre-Survey Submission
    row.push(get (userWorkshop, ['surveySumbissions', PRE_WORKSHOP_SURVEY]) || 0);               
    //Post-Survey	
    row.push(get (userWorkshop, ['surveySumbissions', POST_WORKSHOP_SURVEY]) || 0);
    //Self Evaluation
    row.push(get(userWorkshop, ['surveySumbissions', POST_WORKSHOP_SURVEY]) || 0);
    //Interested attending Next Level
    row.push(get(userWorkshop, ['surveySumbissions','interestedInHigherLevelWorkshop']) || 0);
    //Quiz Performance	
    row.push(get(userWorkshop, ['quizPerformance', 'aggregated', 'quizzesPercentageScore']) || 0);
    //Count of quiz attempts	
    row.push(get(userWorkshop, ['quizPerformance', 'aggregated', 'totalQuizAttempted']) || 0);
    //% Test Score
    row.push(get(userWorkshop, ['quizPerformance', 'aggregated', 'testPercentageScore']) || 0);
    //Recommendation Status
    row.push(get(userWorkshop, ['recommendation', 'isRecommended']) || 0);
    return row;


}

const generateQPFirstTwoRows = async (workshopId) => {
    
    const pollWiseAttendance = [], maxPollMarks = [];
    await es.dsl.execute([
        'pollWiseCounts = []',
        `async each ${config.scoredPollTypes} as pollType`, [
            `search poll where {workshopCode: ${workshopId}, pollType: *pollType} as workshopAllPollsOfType. Get 200 at a time.`, 
            'async each workshopAllPollsOfType as poll', [
                async (ctx) => {
                    const poll = ctx.get('poll');
                    //Get max poll marks
                    maxPollMarks.push(poll._source.questions.length);
                    //Get user count who attempted this poll
                    const pollAttemptsData = await ctx.es.search.collect({
                        '_type': 'doc',
                        '_index': 'user-polls',
                        'body': {
                            'size': 0,
                            'filter': {
                                'match_phrase': {
                                    'poll._id': poll._id
                                }
                            }
                        }
                    });
                    pollWiseAttendance.push(pollAttemptsData.hits.total.value);
                }
            ]
        ]
    ]);

    let headerRow1 = ['Key', 'NOT ATTEMPTED', 'Total Attended'];
    headerRow1 = headerRow1.concat(pollWiseAttendance);
    let headerRow2 = ['', '', 'Max Score'];
    headerRow2.push(maxPollMarks);
    return headerRow1.join(',') + '\n' + headerRow2.join(',');
}


const arrayOfSize = (size, defaultValue) => {
    const arr = [];
    for (let i = 0; i < size; i++) {
        arr.push(defaultValue);
    }
    return arr;
};

let EMPTY_QUIZ_COLUMNS_VALUES = arrayOfSize(26, '');
let EMPTY_MORNING_QUIZ_COLUMNS_VALUES = arrayOfSize(8, '');
let EMPTY_TEST_COLUMNS_VALUES = arrayOfSize(6, '');
const generateQPRow = (ctx) => {
    const user = ctx.get('user');
    const userWorkshop = ctx.get('user-workshop')._source;
    const row = [];
    //Email: Pushing user id for now
    row.push(user._id);
    //First Name
    row.push(user._source.firstName || '');
    //Last Name
    row.push(user._source.lastName || '');

    //Performance for pollType: quiz
    //Series of pairs of columns repeating the pattern - QzN, QzN %
    const quizWiseMarks = get(userWorkshop, ['aggregated', 'quiz', 'pollWiseMarks']);
    if (quizWiseMarks) {
        for (let quizMarks of quizWiseMarks) {
            row.push(quizMarks);
            row.push(''); //Not calculating percentage score for now , per quiz
        }
    } else {
        row = row.concat(EMPTY_QUIZ_COLUMNS_VALUES);
    };

    const morningQuizWiseMarks = get(userWorkshop, ['aggregated', 'morning-quiz', 'pollWiseMarks']);
    if (morningQuizWiseMarks) {
        for (let morningQuizMarks of morningQuizWiseMarks) {
            row.push(morningQuizMarks);
            row.push(''); //Not calculating percentage score for now , per quiz
        }
    } else {
        row = row.concat(EMPTY_MORNING_QUIZ_COLUMNS_VALUES);
    };

    const testWiseMarks = get(userWorkshop, ['aggregated', 'test', 'pollWiseMarks']);
    if (testWiseMarks) {
        for (let testMarks of testWiseMarks) {
            row.push(testMarks);
            row.push(''); //Not calculating percentage score for now , per test
        }
    } else {
        row = row.concat(EMPTY_TEST_COLUMNS_VALUES);
    };

}