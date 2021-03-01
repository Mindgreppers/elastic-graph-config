export default {
    sources: {
        aicte: {
            registrations: {
                //numericalColumns: ['timeInSession']
            },
        },
        googleForms: {
            includedColumns: ['timestamp', 'emailAddress', 'confirmEmailAddress', 'selectWorkshop', 'salutation', 'name'],
            formTypes: ['pre_workshop_survey_responses_v2', 'self_evaluation_post_workshop_survey_and_reedback_responses', 'workshop_assignment_day_1_responses', 'workshop_assignment_day_2_responses', 'workshop_assignment_day_3_responses', 'workshop_assignment_day_4_responses']
        },
        zoom: { //Leave it empty if to be empty, but keep this key.
            numericalColumns: ['timeInSession']
        }

    },
    numDays: 5,
    pollTypes: ['quiz', 'morning-quiz', 'test', 'poll'],
    regex: {
        removeNonAlphabetNumeric: /[^a-zA-Z0-9]/g,
        removeNonAlphabet: /[^a-zA-Z]/g
    },
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
        "sessionDurationOfficial": {
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
        "Minimum Test Score for Certificate Recommendetion": 60
    }

}