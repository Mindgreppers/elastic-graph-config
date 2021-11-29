'use strict'
const _ = require('lodash')
const debug = require('debug')('pipelines/migration')
var ElasticGraph = require('elasticgraph')
var es = new ElasticGraph(process.argv[2])
//where {email: "snehamayeemohapatra@soa.ac.in"}
//Get and search retrieve entity object(s) from in memory cache which in turn is flled from ES as each respective query happens for first time. These are mutable objects. The idea is to let them go through a process of multiple mutations in memory during the migration process. 
//Once the old tables are processed, (only) the updated rows in cache are flushed to ES.
const saveAttendanceWithUserWorkshopRelationships = [
        'iterate over raw_attendances as raw_attendance. Get 200 at a time. Flush every 2 cycles. Wait for 2000 millis', [
            'search first user where {emailId: *raw_attendance.email} as user.',
            //'search first state where {name: *raw_attendance.state} as state. Create if not exists.',
            'attendance is {_type: attendance, user._id: *user._id, joinTime: *raw_attendance.joinTime, leaveTime: *raw_attendance.leaveTime, timeInSession: *raw_attendance.timeInSession, dayNumber: 1}',
            'index *attendance'
        ]

    ]
//where {InstituteState: "Haryana"} 
const saveUsers = [
    'iterate over raw_users as raw_user. Get 100 at a time. Flush every 2 cycles. Wait for 1000 millis.', [
        'search first state where {name: *raw_user.InstituteState}. Create if not exists.',
        'user is {_type: user, state._id: *state._id emailId: *raw_user.CandidateEmail, firstName: *raw_user.CandidateName}',
        'index *user',
    ]
]

const done = () => debug('done')

const executeOneByOne = (instructions, ctx) => {
    return instructions.reduce((previousPromise, instruction) => {
        return previousPromise
        .then(() => { 
            return es.dsl.execute(instruction, ctx)
            .then(() => ctx.flush(true) && debug('flushed and emptied the cache', instruction))
        })
    }, Promise.resolve());
}

if (require.main === module) {
    const ctx = new es.Cache(es, {})

    const instructions = [
        saveUsers,
        saveAttendanceWithUserWorkshopRelationships
    ]
    return executeOneByOne(instructions, ctx)
        .then((res) => {
            const updatedKeys =
                _(ctx.data)
                .keys()
                .filter((key) => ctx.data[key].isUpdated)
                .uniq((key) => ctx.get(key)._id + ctx.get(key)._type)
                .value()
            debug('will flush the cache with ', updatedKeys.length + ' updated entities')
            return ctx.flush(true)
        })
        .then(() => debug('flushed the cache'))
        .catch((err) => 
            debug('Error in running program', err)
        );
}

//const profiler = require('./profiler')
    //const profileId = process.argv[3] || 'default'
    //profiler.init('/Users/namgyal/NewDatabase/DalaiLama/backend/app/dbMigration/profiler', profileId)
    //setTimeout(() => profiler.stop(profileId), 30000)
    