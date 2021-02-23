export default {
    sources: {
        aicte: {
            registrations: {
                numericalColumns: ['candidateMobilenumber']
            },
        },
        googleForms: {
            formTypes: ['pre_workshop_survey_responses_v2'],
            includedColumns: ['timestamp', 'emailAddress', 'confirmEmailAddress', 'selectWorkshop', 'salutation', 'name']
        },
        zoom: {
            
        }
        
    }
}