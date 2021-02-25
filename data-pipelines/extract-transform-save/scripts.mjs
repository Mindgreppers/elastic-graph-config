'use strict'
import _ from 'lodash';
import poll from './poll.mjs';

//Get and search retrieve entity object(s) from in memory cache which in turn is flled from ES as each respective query happens for first time. These are mutable objects. The idea is to let them go through a process of multiple mutations in memory during the migration process. 
//Once the instructions are processed, (only) the updated rows in cache are flushed to ES.

export const savePollData = poll;

export const saveWorkshop = (workshopCode) => {
    return [
        `get workshop ${workshopCode}.`,
        `if *workshop is empty, newWorkshop is {_id: ${workshopCode}, _type: workshop}`,
        'if *workshop is empty, index *newWorkshop'
    ];
};


/**
 * Important: In this script, we are assuming that AICTE registration data has been already filled
 * before calling this script.
 * @param workshopCode 
 */
export const saveWorkshopAttendancesAlongWithNonRegisteredUsers = (workshopCode) => {
    const instructions = []
    for (let day = 1; day <= 5; day++) {
        instructions.push(saveWorkshopDaySessionAttendanceAlongWithNonRegisteredUsers(workshopCode, day, 'morning')),
        instructions.push(saveWorkshopDaySessionAttendanceAlongWithNonRegisteredUsers(workshopCode, day, 'evening'));
    }
    return instructions;
}

const saveWorkshopDaySessionAttendanceAlongWithNonRegisteredUsers = (workshopCode, day, session) => {
    return [
        `get workshop ${workshopCode}`,
        `iterate over day_${day}_${session}_attendee_report where {workshopCode: ${workshopCode}} as raw_attendance. Get 500 at a time. Flush every 8 cycles. Wait for 500 millis`, [
            'search first user where {emailId: *raw_attendance.email} as user. Create if not exists.',
            //'display *user',
            //Next: If the user was newly created in previous statement, 
            //it means he was not in the AICTE registerations data. Hence (s)he must not be having a firstName. 
            //In this case we will save the user with additional data as captured from this attendance record
            //'if *user.firstName is not empty, display *user.firstName',
            'if *user.firstName is not empty, link *user with *workshop as workshops',

            'if *user.firstName is empty, userWasNotFound is true.',
            `if *userWasNotFound is true, user is {
                _id: *user._id,
                _type: user,
                emailId: *user.emailId,
                firstName: *raw_attendance.firstName,
                lastName: *raw_attendance.lastName,
                name: *raw_attendance.userName,
                workshops: *user.workshops,
                registeredAICTE: false
            }`,
            //'display *userWasNotFound.',
            'if *userWasNotFound is true, index *user',
            //'if *user.registeredAICTE is false, display *user.', //If user was created with "Search by email 
            //and create not exists" instruction above, it needs to be saved as non AICTE registered user.
            
            //'if *raw_attendance.joinTime is empty, display *raw_attendance._id.',
            //'if *raw_attendance.joinTime is empty, stop here.',//Dont save empty attendance records

            //Create and save attendance record anyway
            
            
            `attendance is {
                _type: attendance, 
                user._id: *user._id,
                joinTime: *raw_attendance.joinTime,
                leaveTime: *raw_attendance.leaveTime,
                timeInSession: *raw_attendance.timeInSession,
                dayNumber: ${day},
                sessionType: ${session},
                workshop._id: ${workshopCode}
            }`,
            //Index in cache, to be later flushed in ES
            'index *attendance'
        ]
    ];
};

export const saveUsersStatesCitiesFromAICTE = [
    'iterate over aicte_registrations as raw_user. Get 200 at a time. Flush every 10 cycles. Wait for 500 millis.', [
        'search first state where {name: *raw_user.instituteState}. Create if not exists.',
        'search first city where {name: *raw_user.instituteCity, state._id: *state._id}. Create if not exists.',
        'user is {_type: user, registeredAICTE: true, state._id: *city.state._id, city._id: *city._id, emailId: *raw_user.candidateEmail, name: *raw_user.candidateName, registeredAICTE: true}',
        'index *user',
    ]
];

//Google forms import
import dataConfig from './data_config.mjs';
export const saveDifferentGoogleForms = () => {
    const formTypes = dataConfig.sources.googleForms.formTypes;
    return formTypes.map(formType => googleFormImportInstructions(formType));
};

const googleFormImportInstructions = (formType) => {
    return [
        `iterate over ${formType} as formEntry. Get 450 at a time. Flush every 10 cycles. Wait for 500 millis.`, [
            //formResponse is {formType: ${formType}, ...formEntry(name, emailAddress,timestamp)}
            `formResponse is {_type:  google_form_response,formType: ${formType}, name: *formEntry.name, emailAddress: *formEntry.emailAddress, timestamp: *formEntry.timestamp}`,
            'index *formResponse'
        ]
    ];
};

//const profiler = require('./profiler')
    //const profileId = process.argv[3] || 'default'
    //profiler.init('/Users/namgyal/NewDatabase/DalaiLama/backend/app/dbMigration/profiler', profileId)
    //setTimeout(() => profiler.stop(profileId), 30000)
    