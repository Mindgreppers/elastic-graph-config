import ElasticGraph from 'elasticgraph';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
const es = new ElasticGraph(argv.configPath);

const generateTranscriptForWorkshop = (workshopCode) => {
    const script = [
        `iterate over aicte_registration where {workshopCode: ${workshopCode}} as workshopAttendee. Get 1 at a time. Flush every 2 cycles. Wait for 400 millis.`, [

        ]
    ]
};


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
    
}

const incrementQuestionCountForWorkshopFromThisPoll = (ctx) => {
    
    const pollInfo = ctx.get('poll')._source;
    const numQuestionsThisPoll = pollInfo.questions ? pollInfo.questions.length : 0;

    const workshop = ctx.get('workshop');
    let workshopQuestionCurrentCount = workshop._source.questionCounts || (workshop._source.questionCounts = {}); 
       
    workshopQuestionCurrentCount[pollInfo.pollType] 
        = (workshopQuestionCurrentCount[pollInfo.pollType] || 0) + numQuestionsThisPoll; 
    ctx.markDirtyEntity(workshop);
};