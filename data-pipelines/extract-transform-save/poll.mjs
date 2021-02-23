import _ from "lodash";

export default (workshopCode) => {
    const instructions = [];
    for (let day = 1; day <= 5; day++) {
        instructions.push(savePollResponses(workshopCode, day, 'morning'));    
    };

    for (let day = 1; day <= 4; day++) { //Only four day evening reports are there
        instructions.push(savePollResponses(workshopCode, day, 'evening'));
    };

    return instructions;
};

const savePollResponses = (workshopCode, day, session) => {
    return [
        `get workshop ${workshopCode}`,
        `iterate over day_${day}_${session}_poll_report where {workshopCode: "${workshopCode}"} as raw_poll. Get 250 at a time. Flush every 2 cycles. Wait for 500 millis`, [
            'search first user where {emailId: *raw_poll.userEmail} as user.',            
            'if *user is empty, stop here.',
            //'display *raw_poll',
            setPollTypeInContext, //sets pollType variable in ctx depending on quizCode entered by UHS
            `search first poll where {day: ${day}, session: ${session}, pollType: *pollType, workshop._id: ${workshopCode} } as poll. Create if not exists.`,
            createQuestionsIfNewAndSaveUserResponse,          
        ]
    ]
};

//Type, day, session
const setPollTypeInContext = (ctx) => {
    let firstQuestion = ctx.get('raw_poll')._source['_0']; //First question should have this column name
    if (!firstQuestion) {
        //console.log(ctx.get('raw_poll'));
        return;
    }
    firstQuestion = firstQuestion.toLowerCase();
    let pollType;
    if (firstQuestion.includes('#qzm')) {
        pollType = 'morning-quiz';
    } else if (firstQuestion.includes('#qzt1p')) {
        pollType = 'test';
    } else if (firstQuestion.includes('#qz')) {
        pollType = 'quiz';
    } else {
        pollType = 'poll'
    }
    return ctx.setImmutable('pollType', pollType);
}

const createQuestionsIfNewAndSaveUserResponse = async (ctx) => {
    let rawPoll = ctx.get('raw_poll');
    rawPoll = rawPoll._source || rawPoll.fields;
    
    //All questions and answer columns are of the format _N where N is number
    //A column of question is followed by a column of answer.
    const scriptsToRun = Object.keys(rawPoll)
        .filter((columnName) => {
            const numericalPart = columnName.match('^_(\\d+)$');
            if (numericalPart && (numericalPart[1] % 2) === 0) { //If matched number is an even number
                return true; //Only even numbered columns have questions. odd have answers.
            }
        })
        .map ((columnName) => {
            //Make sure to remove the quiz number from the question
            const indexOfHash = rawPoll[columnName].indexOf("#");
            const questionText = indexOfHash === -1 ? 
                rawPoll[columnName] : rawPoll[columnName].substr(0, indexOfHash);
            return [
                `search first question where {text: "${questionText}"} as question. Create if not exists.`,
                'link *question with *poll as polls',
                async (ctx) => { //set isAnswerCorrect
                    if (ctx.get('pollType') === 'poll') {
                        return ctx;
                    }
                    const answerColumn = `_${+columnName.substr(1) + 1}`;
                    const answer = rawPoll[answerColumn];
                    if (!answer) {//Meants that the question was not answered by user
                        return ctx.setImmutable('ignoreThisQuestion', 1);
                    }
                    if (answer.includes(';')) {
                        answer = answer.split(';')[0];
                    }

                    let optionCode = answer.match(/#([^#]*)#/);
                    optionCode = optionCode && optionCode[1];
                    
                    const quizKey = await ctx.es.dsl.execute(`search first quiz_key where {optionCode: ${optionCode}}`, ctx);
                    
                    const marks = +quizKey[0]._source.marks;
                    if (marks) {
                        ctx = ctx.setImmutable('isCorrectAnswer', 1);
                    } else {
                        ctx = ctx.setImmutable('isCorrectAnswer', 0);
                    }
                    return ctx;
                },
                //'display *poll',
                `if *ignoreThisQuestion is empty, uqa is {
                    _type: user-question-answer,
                    user._id: *user._id,
                    question._id: *question._id,
                    isCorrect: *isCorrectAnswer,
                    workshop._id: *workshop._id,
                    poll._id: *poll._id
                }`,
                'if *ignoreThisQuestion is empty, index *uqa'
            ];
            //Not filling choices of answers for now.
        });
    //Execute all the generated script one by one.
    for await (let script of scriptsToRun) {
        await ctx.es.dsl.execute(script, ctx)
    };

    return ctx;
};