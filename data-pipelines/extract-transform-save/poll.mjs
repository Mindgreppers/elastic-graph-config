import _ from "lodash";
import updateDoc from 'js-object-updater';

export default (workshopCode) => {
    
    const instructions = [];
    //instructions.push(loadQuizKeys());
    for (let day = 1; day <= 5; day++) {
        instructions.push(savePollResponses(workshopCode, day, 'morning'));    
    };

    for (let day = 1; day <= 4; day++) { //Only four day evening reports are there
        instructions.push(savePollResponses(workshopCode, day, 'evening'));
    };

    return instructions;
};
const loadQuizKeys = () => {
    return [
        'quiz_keys is {}',
        'iterate over quiz_keys as quiz_key. Get 1000 at a time.', [
            (ctx) => {
                const quizKey = ctx.get('quiz_key');
                const optionCode = quizKey._source.optionCode;
                quiz_keys[optionCode] = quizKey._source.marks;
            }
        ]
    ]
}
let c = 0, cerr = 0, p = 0, perr = 0;
const savePollResponses = (workshopCode, day, session) => {
    return [
        `get workshop ${workshopCode}`,
        
        `iterate over day_${day}_${session}_poll_report where {workshopCode: "${workshopCode}"} as userPollAttempt. Get 500 at a time. Flush every 10 cycles. Wait for 300 millis`, [
            
            'search first user where {emailId: *userPollAttempt.userEmail} as user.',            
            (ctx) => {
                if (!ctx.get('user')) {
                    cerr++;
                } else {
                    c++;
                    if (ctx.get('user')._source.emailId !== ctx.get('userPollAttempt')._source.userEmail) {
                        console.log('dsdsd', ctx.get('user')._source.emailId, ctx.get('userPollAttempt')._source.userEmail)
                    }
                }
            },
            'if *user is empty, stop here.',
            
            setPollTypeInContext, //sets pollType variable in ctx depending on quizCode entered by UHS
            (ctx) => {
                if (!ctx.get('pollType')) {
                    perr++;
                } else {
                    p++;
                }
                console.log('poll attempts', p, perr, 'users', c, cerr);
            },
            `if *pollType is empty, stop here.`, //Means the poll was not attempted at all
            `if *pollType is empty, display XXX`,
            //Search and create if necessary, the poll
            `search first poll where {day: ${day}, session: ${session}, pollType: *pollType, workshop._id: ${workshopCode} } as poll. Create if not exists.`,
            `search first user-poll where {poll._id: *poll._id, user._id: *user._id} as userPollAttempt. Create if not exists.`,
            //Create user-poll document to store user's attempted questions and marks
            //createUserPollInfoDoc,

            //Save user's marks in previously created user-poll document
            //for all the questions attempted by him/her for this poll
            saveUserPollMarks
        ]
    ]
};

const setPollTypeInContext = (ctx) => {
    let firstQuestion = ctx.get('userPollAttempt')._source['_0']; //First question should have this column name
    
    //If no question was attempted, we let pollType be undefined because poll type is stored in the questions, 
    //in the input data;
    if (!firstQuestion) {
        return;
    }

    //Viola! 
    //Poll was attempted.
    //Proceed to set proper pollType by parsing the code
    //of the first question. All remaining questions have the same code.
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

const createUserPollInfoDoc = async (ctx) => {
    
    const scripts = [
        `userPollAttempt is {
            _type: user-poll,
            poll._id: *poll._id, 
            user._id: *user._id
        }`,
        'index *userPollAttempt',
    ];
    await ctx.es.dsl.execute(scripts, ctx);
};

const saveUserPollMarks = async (ctx) => {
    let rawPoll = ctx.get('userPollAttempt');
    rawPoll = rawPoll._source || rawPoll.fields;
    
    //All questions and answer columns are of the format _N where N is number
    //A column of question is followed by a column of answer.
    const questions = Object.keys(rawPoll)
        .filter((columnName) => {
            const numericalPart = columnName.match('^_(\\d+)$'); //_N
            if (numericalPart && (numericalPart[1] % 2) === 0) { //If matched number is an even number
                return true; //Only even numbered columns have questions. odd have answers.
            }
        });
    
    
    const scriptsToRun = questionWiseScripts(rawPoll, questions);
    
    //Execute all the generated scripts and wait till all of them complete.
    await Promise.all(
        scriptsToRun.map((script) => ctx.es.dsl.execute(script, ctx))
    );

    return ctx;
};

const questionWiseScripts = (rawPoll, questions) => {
    return questions.map ((questionColumn) => {
        //Get the question text, after removing the quiz/test/morning-quiz 
        //#number# from its tail-end
        const questionText = getQuestionText(rawPoll[questionColumn]);

        return [
            `search first question where {text: "${questionText}"} as question. Create if not exists.`,
            'link *question with *poll as polls',
            //Give marks to answers in test, quiz, morning quiz
            //Questions and marks are stored in user-poll table
            async (ctx) => {
                //Ignore polls
                if (ctx.get('pollType') === 'poll') {          
                    return ctx;
                }
                
                //Ignore not attempted questions
                const answerColumn = `_${+questionColumn.substr(1) + 1}`;
                let answer = rawPoll[answerColumn];
                if (!answer) { 
                    return ctx;
                }

                //Store the marks against the attempted question
                saveMarksForAttemptedQuestion(ctx, answer);
            }
        ];
        //Not filling choices of answers for now.
    });
}

const getQuestionText = (fullText) => {
    const indexOfHash = fullText.indexOf("#");
    return indexOfHash === -1 ? fullText : fullText.substr(0, indexOfHash);
};

const saveMarksForAttemptedQuestion = (ctx, answer) => {
    const userPoll = ctx.get('user-poll');
    const question = ctx.get('question');
    const marks = getMarks(ctx, answer);
    updateDoc({
        doc: userPoll._source,
        force: true,
        update: {
            push: {
                "marks": {
                    [question._id]: marks 
                }
            }
        }
      });
}

const getMarks = async (ctx, answer) => {
    if (answer.includes(';')) {
        answer = answer.split(';')[0];
    }

    let optionCode = answer.match(/#([^#]*)#/);
    optionCode = optionCode && optionCode[1];
    
    const quizKey = 
        await ctx.es.dsl.execute(`search first quiz_key where {optionCode: ${optionCode}}`, ctx);
    
        //quizKey has marks stored as string. Will use implicit conversion to number
    return +(quizKey[0]._source.marks);
};