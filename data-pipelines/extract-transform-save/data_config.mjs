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
        
    }
}