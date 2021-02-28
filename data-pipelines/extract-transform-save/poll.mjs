import _ from "lodash";
import updateDoc from 'js-object-updater';

export default (workshopCode) => {
    
    const instructions = [];
    //instructions.push(loadQuizKeys());
    for (let day = 4; day <= 5; day++) {
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
//let c = 0, cerr = 0, p = 0, perr = 0;
const savePollResponses = (workshopCode, day, session) => {
    return [
        `get workshop ${workshopCode}`,
        
        `iterate over day_${day}_${session}_poll_report where {workshopCode: "${workshopCode}"} as rawPoll. Get 300 at a time. Flush every 5 cycles. Wait for 300 millis`, [
            
            'search first user where {emailId: *rawPoll.userEmail} as user.',    
            'if *user is empty, display found empty user, *rawPoll.userEmail',
            'if *user is empty, stop here.',
            
            //Handle poll response of this user.

            //Set polls unique id and pollType in the rawPoll object.
            //Used in creating the new poll object later.
            //If not question was attempted by user, dont create the poll or proceed further.
            //Proceed only if the user attempted at least one question
            (ctx) => {
                
                const rawPoll = ctx.get('rawPoll');
                
                //Set the poll type based on the codes embedded in the questions
                //If user did not attempt any question, pollType will be set as null
                setPollTypeInRawPoll(rawPoll._source);

                //Decide the uniqueId for this poll based on questions
                //Concat all questions and remove all whitespace
                const questionColumns = getQuestionsColumns(rawPoll._source);
                const questionTexts = questionColumns.map((qc) => rawPoll._source[qc]);
                rawPoll.uniqueId = //Remove all non letter, non number or not ,.: characters
                    questionTexts.join('').replace(/[^a-zA-Z']//g);
                
            },

            //If the poll was not attempted at all, pollType is not set.
            //Hence don't proceed if pollType is null.
            `if *rawPoll.pollType is empty, stop here.`, 

            //Search the poll. Create if not existing. For found
            `pollQuery is {
                day: ${day}, 
                session: ${session}, 
                pollType: *rawPoll.pollType, 
                workshop._id: ${workshopCode}, 
                uniqueId: *rawPoll.uniqueId
            }`,
            `search first poll where *pollQuery as poll. Create if not exists.`,
            
            //Create user-poll document to store user's attempted questions and marks
            
            `userPollAttempt is {
                _type: user-poll,
                poll._id: *poll._id, 
                user._id: *user._id
            }`,
            'index *userPollAttempt',
            //Save user's marks in previously created user-poll document
            //for all the questions attempted by him/her for this poll
            saveUserPollMarks,
            
            //Now save the workshop level data for this poll, and user.
            addMarksAttemptsToWorkshopPerformance
        ]
    ]
};

const setPollTypeInRawPoll = (rawPollSource) => {
    let firstQuestion = rawPollSource['_0']; //First question should have this column name
    
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
    rawPollSource.pollType = pollType;
}

const saveUserPollMarks = async (ctx) => {
    let rawPollSource = ctx.get('rawPoll')._source;
    
    //All questions and answer columns are of the format _N where N is number
    //A column of question is followed by a column of answer.
    
    const questions = getQuestionsColumns(rawPollSource);
    
    const scriptsToRun = saveUserPollQAData(rawPollSource, questions);
    
    //Execute all the generated scripts and wait till all of them complete.
    await Promise.all(
        scriptsToRun.map((script) => ctx.es.dsl.execute(script, ctx))
    );

    return ctx;
};

const getQuestionsColumns = (rawPollSource) => {
    return Object.keys(rawPollSource)
        .filter((columnName) => {
            const numericalPart = columnName.match('^_(\\d+)$'); //_N
            if (numericalPart && (numericalPart[1] % 2) === 0) { //If matched number is an even number
                return true; //Only even numbered columns have questions. odd have answers.
            }
        });
}

const saveUserPollQAData = (rawPoll, questions) => {
    return questions.map ((questionColumn) => {
        //Get the question text, after removing the quiz/test/morning-quiz 
        //#number# from its tail-end
        let questionText = getQuestionText(rawPoll[questionColumn]);
        questionText = questionText.replace(/[^a-zA-Z\.,:!']//g, '');

        return [
            `search first question where {uniqueId: "${questionText}"} as question. Create if not exists.`,
            'link *question with *poll as polls',
            //Give marks to answers in test, quiz, morning quiz
            //Questions and marks for this poll are stored in user-poll table
            //Also add to the user's cumulative data for this workshop, from this poll
            async (ctx) => {
                
                //Ignore not attempted questions
                const answerColumn = `_${+questionColumn.substr(1) + 1}`;
                let answer = rawPoll[answerColumn];
                if (!answer) { 
                    return;
                }

                //Store the marks against the attempted question
                //Not filling the user's actual answers as of now.
                await saveQuestionMarksInUserPoll(ctx, answer);
            }
        ];
    });
}

const getQuestionText = (fullText) => {
    const indexOfHash = fullText.indexOf("#");
    return indexOfHash === -1 ? fullText : fullText.substr(0, indexOfHash);
};

const saveQuestionMarksInUserPoll = async (ctx, answer) => {
    const pollType = ctx.get('poll')._source.pollType;
    const userPoll = ctx.get('user-poll');
    
    //Increment total answers attempted by the user
    userPoll._source.numAnswers = (userPoll._source.numAnswers || 0) + 1;

    //Compute poll totalMarks and also question wise marks for test, quiz, morning-quiz. Ignore type poll.
    if (pollType && pollType != 'poll') {
        
        const marks = await getMarks(ctx, answer);    
        //Set total marks
        userPoll._source.totalMarks = (userPoll._source.totalMarks || 0) + marks;
        //Set question wise marks
        const question = ctx.get('question');
        updateDoc({
            doc: userPoll._source,
            force: true,
            update: {
                push: {
                    "questionWiseMarks": {
                        [question._id]: marks 
                    }
                }
            }
        });
    }
}

const addMarksAttemptsToWorkshopPerformance = async (ctx) => {
    //Get workshop data for this user
    await ctx.es.dsl.execute([
        
        `userWorkshopDataQuery is {
            user._id: *user._id, 
            workshop._id: *workshop._id
        }`,
        'search first user-workshop where *userWorkshopDataQuery as userWorkshopData. Create if not exists.',
        (ctx) => {
            
            const userWorkshopData = ctx.get('userWorkshopData');
            //Get the current aggregated data for this poll's type or initialize to empty
            const pollType = ctx.get('poll')._source.pollType;
            
            let {totalMarks, numAnswers, numPollsAttempted} = userWorkshopData._source[pollType] || {
                    totalMarks: 0, 
                    numAnswers: 0, 
                    numPollsAttempted: 0
                };
             
            //Increment user's marks and attempts count from this poll, into workshop's pollType aggregated data
            const userPoll = ctx.get('user-poll');
            totalMarks += userPoll._source.totalMarks || 0;
            numAnswers += userPoll._source.numAnswers;
            numPollsAttempted += 1;
            //Set in the in memory object, for later indexing in the database
            userWorkshopData._source[pollType] = {totalMarks, numAnswers, numPollsAttempted};
            
            ctx.markDirtyEntity(userWorkshopData);
        }
    ], ctx);
    
};


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