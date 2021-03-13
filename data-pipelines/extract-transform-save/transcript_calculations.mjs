import Debug from 'debug';
import config from './data_config.mjs';
const debug = new Debug('transcript_calculation');

const workshopDays = ['day1', 'day2', 'day3', 'day4', 'day5'];
const POST_WORKSHOP_SURVEY = config.sources.googleForms.postWorkshopSurvey;
const PRE_WORKSHOP_SURVEY = config.sources.googleForms.preWorkshopSurvey;
const surveyForms = [PRE_WORKSHOP_SURVEY, POST_WORKSHOP_SURVEY];
const formTypes = [...surveyForms, ...config.sources.googleForms.assignmentForms];

export const finalUserWorkshopCalculations = (workshopCode) => {
    const script = [
        `get workshop ${workshopCode} as workshop.`,
        `iterate over user-workshops where {workshop._id: ${workshopCode}} as user-workshop. Get 200 at a time. Flush every 3 cycles. Wait for 500 millis.`, [
            //'if *user-workshop.connectTime is empty, stop here.',
            'if *user-workshop.quizPerformance is empty, stop here.',
            calculateQuizzesScorePercentage,
            calculateTestScoresPercentage,
            calculatePollAttemptPercentage,
            
            calculateFinalAttendance,
            calculateFinalRecommendation,
            (ctx) => {
                const userWorkshop = ctx.get('user-workshop');
                ctx.setEntity(userWorkshop);
                userWorkshop.isUpdated = true;  
            }
        ],
        
    ];
    return script;
};

const calculateFinalRecommendation = (ctx) => {
    const userWorkshop = ctx.get('user-workshop')._source;

    //Check first criterion of attendance
    //Transcripts: AE > Parameter: C17
    const criteriaConnectTimePass =
        userWorkshop.connectTime.finalCalculatedConnectTimePercentage 
        >
        config.parameters["% Average connnect Time for Certificate Recommendetion"];
    
    //Check second criterion of Transcripts: AG + AH + AI >= Parameters: C21
    const AG_totalAssignmentsSubmittedPoints = Object.keys(userWorkshop.assignments || {}).length;
    const AH_preWorkshopSurveySubmittedPoints = get(userWorkshop, ['surveySubmissions', PRE_WORKSHOP_SURVEY]);
    const AI_postWorkshopSurveySubmittedPoints = get(userWorkshop, ['surveySubmissions', POST_WORKSHOP_SURVEY]);
    
    const totalPoints = AG_totalAssignmentsSubmittedPoints + AH_preWorkshopSurveySubmittedPoints + AI_postWorkshopSurveySubmittedPoints;
    
    const parameterMinTotalPoints = config.parameters['Minimum count of Pre, Post etc for Certificate'];

    const criteriaActivitiesPass = totalPoints >= parameterMinTotalPoints;

    //Third criterion: Transcripts: AL (Quiz performance) > Parameters: C20
    const quizzesPercentageScore = userWorkshop.quizPerformance.aggregated.quizzesPercentageScore;
    const parameterMinQuizScore = config.parameters['Minimum Quiz Score for certificate'];
    const criteriaQuizPass = quizzesPercentageScore > parameterMinQuizScore;
    
    //Fourth criterion: Transcripts: AM >= 50% of [Parameters: C19], 
    //i.e. 50% of the total quizzes conducted, floored to integer value.
    const parameterTotalQuizzesHeld = config.parameters['Total Quiz Held'];
    const totalQuizAttempted = userWorkshop.quizPerformance.aggregated.totalQuizAttempted || 0;
    const criteriaQuizAttemptedPass = totalQuizAttempted >= Math.floor(0.5 * parameterTotalQuizzesHeld);

    //Fifth criteria: Transcripts:AN >= Parameters:C22
    const testPercentageScore = userWorkshop.quizPerformance.aggregated.testPercentageScore;
    const parameterMinTestScore = config.parameters['Minimum Test Score for Certificate Recommendetion'];
    const criteriaTestPass = testPercentageScore >= parameterMinTestScore;

    const allCriteriaPass = 
        criteriaActivitiesPass && criteriaConnectTimePass && criteriaQuizAttemptedPass
        && criteriaQuizPass && criteriaTestPass;
    
    
    userWorkshop.recommendation = {
        isRecommended: allCriteriaPass,
        criteriaActivitiesPass,
        criteriaConnectTimePass,
        criteriaQuizAttemptedPass,
        criteriaTestPass,
        criteriaQuizPass
    };
}

//Column AE of transcript
const calculateFinalAttendance = (ctx) => {
    
    const userWorkshop = ctx.get('user-workshop')._source;
    
    //Check daily attendance percentage and average percentage over five days
    calculateComputedConnectTime(userWorkshop);

    //Now set final connect time percentage value dependening on whether user passes the following four cirteria
    if (!userWorkshop.quizPerformance) {
        debug(`found empty quizPerformance for user: ${userWorkshop.user._id}, workshop: ${userWorkshop.workshop._id}`)
        return;
    }  
    //Retrieve all four criteria
    const {isPassDailyPollAttemptCriteria, isPassAveragePollAttemptCriteria} 
        = userWorkshop.quizPerformance.aggregated;
    const {isPassAverageConnectTimeCriteria, isPassDailyMinimumConnectTimeCriteria}
        = userWorkshop.connectTime;
    
    //Check if passes
    const passesAllCriteria = (isPassDailyPollAttemptCriteria && isPassAveragePollAttemptCriteria && 
        isPassAverageConnectTimeCriteria && isPassDailyMinimumConnectTimeCriteria);
    
    //User gets real connect time percentage (if he passes). Else gets 0.
    userWorkshop.connectTime.finalCalculatedConnectTimePercentage = 
        passesAllCriteria ? userWorkshop.connectTime.averagePercentageConnectTime : 0;
 };

const calculateComputedConnectTime = (userWorkshop) => {
    const userConnectTime = userWorkshop.connectTime;
    if (!userConnectTime) {
        debug('Connect time for user is empty');
        return;
    }
    const dailyPercentages = [];
    let isPassDailyMinimumPollAttemptCriteria = true;
    const dailyMinConnectTime = config.parameters["% daily Connect time for Certificate Recommendetion"];
    for (let day of Object.keys(userConnectTime)) {
        if (!day.includes('day')) {
            continue;
        }
        const maxMorningTime = config.parameters.maxSessionDuration[day]["M Min"];
        const maxEveningTime = config.parameters.maxSessionDuration[day]["E Min"];
        const morningTime = Math.min(userConnectTime[day].morning || 0, maxMorningTime);
        const eveningTime = Math.min(userConnectTime[day].evening || 0, maxEveningTime);
        const percentageAttendanceForDay = 100*(morningTime + eveningTime)/(maxMorningTime + maxEveningTime);
        userConnectTime[day].percentageAttendance = +(percentageAttendanceForDay.toFixed(2));
        dailyPercentages.push(percentageAttendanceForDay);
        if (percentageAttendanceForDay < dailyMinConnectTime) {
            isPassDailyMinimumPollAttemptCriteria = false;
        }
    }
    userConnectTime.isPassDailyMinimumConnectTimeCriteria = isPassDailyMinimumPollAttemptCriteria;

    //Now calculate average attendance and find is the user pass on this criteria or not
    const sumOfDailyConnectPercentages 
        = dailyPercentages.reduce((a,b) => a + b, 0);
    userConnectTime.averagePercentageConnectTime 
        = +((sumOfDailyConnectPercentages / dailyPercentages.length).toFixed(2));
    const minimumAverageConnectTime 
        = config.parameters["% Average connnect Time for Certificate Recommendetion"];
    userConnectTime.isPassAverageConnectTimeCriteria 
        = userConnectTime.averagePercentageConnectTime > minimumAverageConnectTime;
};


const calculateTestScoresPercentage = (ctx) => {
    const userWorkshop = ctx.get('user-workshop');
    const quizPerformance = userWorkshop._source.quizPerformance;
    if (!quizPerformance) {
        debug('quiz performance details for user is empty');
        return;
    }
    let totalScore = 0;
    for (let day of workshopDays) {
        totalScore += get(quizPerformance, ['test', day, 'aggregated', 'totalMarks']) || 0;
    }
    quizPerformance.aggregated.totalTestScore = totalScore;
    //Now calculate quiz score percentages
    const workshop = ctx.get('workshop')._source;
    const totalQuestions = workshop.questionCounts.test;
    quizPerformance.aggregated.testPercentageScore
        = +(100 * totalScore / totalQuestions).toFixed(2);

    //Also set total test attempts
    quizPerformance.aggregated.totalTestAttempted = get(quizPerformance, ['test', 'aggregated', 'numPollsAttempted']) || 0;
}

const calculateQuizzesScorePercentage = (ctx) => {
    const userWorkshop = ctx.get('user-workshop');
    const quizPerformance = userWorkshop._source.quizPerformance;
    if (!quizPerformance) {
        debug('quiz performance details for user is empty');
        return;
    }
    let totalScore = 0, numQuizzesAttempted = 0;
    for (let pollType of ['quiz', 'morning-quiz']) {
        for (let day of workshopDays) {
            totalScore += get(quizPerformance, [pollType, day, 'aggregated', 'totalMarks']) || 0;
        }
        //Total attempts of quizzes
        numQuizzesAttempted += get(quizPerformance, [pollType, 'aggregated', 'numPollsAttempted']) || 0;
    }
    quizPerformance.aggregated.totalQuizAttempted = numQuizzesAttempted;
    quizPerformance.aggregated.totalQuizScore = totalScore;
    
    //Now calculate quiz score percentages
    const workshop = ctx.get('workshop')._source;
    const totalQuestions = workshop.questionCounts['quiz'] + workshop.questionCounts['morning-quiz'];
    quizPerformance.aggregated.quizzesPercentageScore
        = +(100 * totalScore / totalQuestions).toFixed(2);
    
};

const calculatePollAttemptPercentage = (ctx) => {
    const userWorkshop = ctx.get('user-workshop');
    const quizPerformance = userWorkshop._source.quizPerformance;
    if (!quizPerformance) {
        debug('quiz performance details for user is empty');
        return;
    }
    const dailyPercentages = [];
    let isPassDailyPollAttemptCriteria = true;
    //First calculate day wise poll percentage and if is pass daily poll attempt criteria
    for (let day of workshopDays) {
        
        let morningPollsAttempted = 0, eveningPollsAttempted = 0;

        for (let pollType of config.pollTypes) {
            morningPollsAttempted += get(quizPerformance, [pollType, day, 'morning', 'aggregated', 'numPollsAttempted']) || 0;
            eveningPollsAttempted += get(quizPerformance, [pollType, day, 'evening', 'aggregated', 'numPollsAttempted']) || 0;
        }

        const maxMorningPolls = config.parameters.pollsHeld[day]["M Polls"];
        morningPollsAttempted = Math.min(morningPollsAttempted, maxMorningPolls);
        
        const maxEveningPolls = config.parameters.pollsHeld[day]["E Polls"];
        eveningPollsAttempted = Math.min(eveningPollsAttempted, maxEveningPolls);
        
        const dayNAttemptPercentage = 100*(morningPollsAttempted + eveningPollsAttempted)/(maxMorningPolls + maxEveningPolls);
        set(quizPerformance, ['aggregated', 'percentagePollsAttempted', day], +dayNAttemptPercentage.toFixed(2));
        dailyPercentages.push(dayNAttemptPercentage);
        if (isPassDailyPollAttemptCriteria && dayNAttemptPercentage < config.parameters["Daily Minimum Attempted Poll %  for Attended % Consideration"]) {
            isPassDailyPollAttemptCriteria = false;
        }
    }
    
    quizPerformance.aggregated.isPassDailyPollAttemptCriteria
        = isPassDailyPollAttemptCriteria;
    
    //Now calculate average attendance percentage and pass criteria
    const sumOfPercentages = dailyPercentages.reduce((a,b) => a + b, 0);
    const averageOfDailyPollAttemptPercentages = sumOfPercentages / dailyPercentages.length;
    quizPerformance.aggregated.averageOfDailyPollAttemptPercentages = averageOfDailyPollAttemptPercentages;
    quizPerformance.aggregated.isPassAveragePollAttemptCriteria 
        = averageOfDailyPollAttemptPercentages >= config.parameters["Average Minimum Attempted Poll % for Attended % considration"];
     
};

const get = (obj, path) => {
    let toReturnObjOrVal = obj;
    for (let edge of path) {
        toReturnObjOrVal = obj[edge];
        if (!toReturnObjOrVal) {
            return;
        }
        obj = toReturnObjOrVal;
    };
    return toReturnObjOrVal;
}

const set = (obj, path, val) => {
    let toUpdateObj = obj;
    for (let i = 0; i < path.length - 1; i++) { //iterate over all edges except last
        let edge = path[i];
        toUpdateObj = obj[edge] || (obj[edge] = {});
        obj = toUpdateObj;
    };
    toUpdateObj[path[path.length - 1]] = val;
}

//Count questions grouped as quizzes (morning quiz or quiz) & tests
export const setQuestionCountsInWorkshop = (workshopCode) => {
    const script = [
        `get workshop ${workshopCode} as workshop.`,
        //get all polls of the workshop where pollType is quiz, morningQuiz, test
        `iterate over polls where {workshop._id: ${workshopCode}} as poll. Get 100 at a time.`,[
            'if *poll.pollType is empty, stop here',
            incrementQuestionCountForWorkshopFromThisPoll
        ],
        // (ctx) => {
        //     ctx.markDirtyEntity(ctx.get('workshop'))
        // }
    ];
    return script;
    
};
let c = 0;
const incrementQuestionCountForWorkshopFromThisPoll = (ctx) => {
    
    const pollInfo = ctx.get('poll')._source;
    const numQuestionsThisPoll = pollInfo.questions ? pollInfo.questions.length : 0;

    const workshop = ctx.get('workshop');
    let workshopQuestionCurrentCount = workshop._source.questionCounts || (workshop._source.questionCounts = {}); 
    debug(workshopQuestionCurrentCount, numQuestionsThisPoll, c = c + numQuestionsThisPoll)
    workshopQuestionCurrentCount[pollInfo.pollType] 
       = (workshopQuestionCurrentCount[pollInfo.pollType] || 0) + numQuestionsThisPoll;
    ctx.markDirtyEntity(workshop);
};