'use strict'
const debug = require('debug')('pipelines/transformation/attendance')
var ElasticGraph = require('elasticgraph')
var es = new ElasticGraph(process.argv[2])

//Get and search retrieve entity object(s) from in memory cache which in turn is flled from ES as each respective query happens for first time. These are mutable objects. The idea is to let them go through a process of multiple mutations in memory during the migration process. 
//Once the old tables are processed, (only) the updated rows in cache are flushed to ES.
const saveAttendanceWithUserWorkshopRelationships = [
        'iterate over raw_attendances as raw_attendance. Get 1 at a time. Flush every 25 cycles. Wait for 100 millis', [
            //'display *raw_attendance',
            'search first user where {emailId: *raw_attendance.email} as user. Create if not exists.',
            'display *user',
            'attendance is {user._id: *user._id, _type: attendance, workshop._id: 1, joinTime: *raw_attendance.joinTime, leaveTime: *raw_attendance.leaveTime, timeInSession: *raw_attendance.timeInSession, dayNumber: 1}',
            'index *attendance'
        ]
    ]

const done = () => debug('done')

const executeOneByOne = (instructions, ctx) => {
    return instructions.reduce((previousPromise, instruction) => {
        return es.dsl.execute(instruction, ctx)
            .then(() => ctx.flush(true) && debug('flush', instruction))
    }, Promise.resolve());
}

if (require.main === module) {
    const ctx = new es.Cache(es, {})

    const instructions = [
        saveAttendanceWithUserWorkshopRelationships
    ]
    debug('starting')
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
        .catch((err) => debug('Error in running program', err))
}

//const profiler = require('./profiler')
    //const profileId = process.argv[3] || 'default'
    //profiler.init('/Users/namgyal/NewDatabase/DalaiLama/backend/app/dbMigration/profiler', profileId)
    //setTimeout(() => profiler.stop(profileId), 30000)
    