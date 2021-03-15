export default {
    sources: {
        aicte: {
            registrations: {
                //numericalColumns: ['timeInSession']
            },
        },
        googleForms: {
            //includedColumns: ['timestamp', 'emailAddress', 'confirmEmailAddress', 'selectWorkshop', 'salutation', 'name'],
            assignmentForms: ['workshop_assignment_day_1_responses', 'workshop_assignment_day_2_responses', 'workshop_assignment_day_3_responses', 'workshop_assignment_day_4_responses'],
            postWorkshopSurvey: 'self_evaluation_post_workshop_survey_and_reedback_responses',
            preWorkshopSurvey: 'pre_workshop_survey_responses_v2',
        },
        zoom: { //Leave it empty if to be empty, but keep this key.
            numericalColumns: ['timeInSession']
        }

    },
    numDays: 5,
    workshopDays: ['day1', 'day2', 'day3', 'day4', 'day5'],
    pollTypes: ['quiz', 'morning-quiz', 'test', 'poll'],
    scoredPollTypes: ['quiz', 'morning-quiz', 'test'],
    regex: {
        removeNonAlphabetNumeric: /[^a-zA-Z0-9]/g,
        removeNonAlphabet: /[^a-zA-Z]/g
    },
    quizPerformanceColumns: ['Email', 'First Name',	'Last Name', 'Qz1',	'Qz1 %', 'Qz2',	'Qz2 %', 'Qz3', 'Qz3 %', 'Qz4',	'Qz4 %', 'Qz5',	'Qz5 %', 'Qz6',	'Qz6 %', 'Qz7',	'Qz7 %', 'Qz8',	'Qz8 %', 'Qz9',	'Qz9 %', 'Qz10', 'Qz10 %', 'Qz11', 'Qz11 %', 'Qz12', 'Qz12 %', 'Qz13', 'Qz13 %', 'QzM1', 'QzM1 %', 'QzM2', 'QzM2 %', 'QzM3', 'QzM3 %', 'QzM4',	'QzM4 %', 'QzT1P1',	'QzT1P1 %',	'QzT1P2', 'QzT1P2 %', 'QzT1P3',	'QzT1P3 %',	'G.Total',	'% score',	'Quiz Count',	'Test Score',	'% Test Score'],
    transcriptColumns: ['Email','Salutation',	'Name (as registered)',	'Designation',	'Institute Name', 'City', 'Phone', 'Day 1 Att',	'Day 1 Poll', 'Day 2 Att', 'Day 2 Poll', 'Day 3 Att', 'Day 3 Poll',	'Day 4 Att', 'Day 4 Poll', 'Day 5 Att',	'Day 5 Poll', 'Pre-wksp Survey', 'Post wksp survey', 'Post wksp feedback form',	'Assignment 1',	'Assignment 2',	'Assignment 3',	'Assignment 4',	'Rating of FDP : Content', 'Rating of FDP : Process', 'Rating of FDP : Facilitator(s)', 'Rating of organisation of FDP : Communication (before FDP)', 'Rating of organisation of FDP: Communication (after FDP)', '% Connect Time', '% Attended' , 'Polls Participated', 'No. of Submitted Assignments', 'Pre-Survey Submission', 'Post-Survey', 'Self Evaluation', 'Interested attending Next Level',	'Quiz Performance', 'Count of quiz attempts', '% Test Score', 'Recommendation Status', 'programid','FDP ID'],
    parameters: {
        "pollsHeld": {
            "day1": {
                "Tot Polls": 17,
                "M Polls": 14,
                "E Polls": 3
            },
            "day2": {
                "Tot Polls": 22,
                "M Polls": 19,
                "E Polls": 3
            },
            "day3": {
                "Tot Polls": 25,
                "M Polls": 22,
                "E Polls": 3
            },
            "day4": {
                "Tot Polls": 16,
                "M Polls": 13,
                "E Polls": 3
            },
            "day5": {
                "Tot Polls": 5,
                "M Polls": 5,
                "E Polls": 0
            }
        },
        "maxSessionDuration": {
            "day1": {
                "Tot Min": 285,
                "M Min": 225,
                "E Min": 60
            },
            "day2": {
                "Tot Min": 285,
                "M Min": 225,
                "E Min": 60
            },
            "day3": {
                "Tot Min": 285,
                "M Min": 225,
                "E Min": 60
            },
            "day4": {
                "Tot Min": 285,
                "M Min": 225,
                "E Min": 60
            },
            "day5": {
                "Tot Min": 225,
                "M Min": 225,
                "E Min": 0
            }
        },
        "% daily Connect time for Certificate Recommendetion": 60,
        "% Average connnect Time for Certificate Recommendetion": 80,
        "% connect time for considering as participent": 1,
        "Total Quiz Held": 17,
        "Minimum Quiz Score for certificate": 30,
        "Minimum count of Pre, Post etc for Certificate": 3,
        "Minimum Test Score for Certificate Recommendetion": 60,
        "Daily Minimum Attempted Poll %  for Attended % Consideration": 25,
        "Average Minimum Attempted Poll % for Attended % considration": 40
    }

}