'use strict'
const async = require('async-q')
    //const _ = require('lodash')
const debug = require('debug')('pipelines/transformation/attendance')

var ElasticGraph = require('elasticgraph')
var es = new ElasticGraph(process.argv[2])

const saveAttendanceWithUserWorkshopRelationships = [
        'iterate over raw_attendances as raw_attendance. Get 1 at a time. Flush every 25 cycles. Wait for 100 millis', [
            //'display *raw_attendance',
            'search first user where {emailId: *raw_attendance.email, firstName: *raw_attendance.firstName, lastName: *raw_attendance.lastName} as user. Create if not exists.',
            //'display *user',
            'attendance is {user._id: *user._id, _type: attendance, workshop._id: 11a063a749a0404de3945ae0ed7e62da55101b91, joinTime: *raw_attendance.joinTime, leaveTime: *raw_attendance.leaveTime, timeInSession: *raw_attendance.timeInSession, dayNumber: 1}',
            'index *attendance'
        ]
    ]
    //Get and search retrieve entity object(s) from in memory cache which in turn is flled from ES as each respective query happens for first time. These are mutable objects. The idea is to let them go through a process of multiple mutations in memory during the migration process. Once the old tables are processed, (only) the dirty entities in cache are flushed to ES.

//With fields in search
//Get stament ended with 'in languages'
let n = 1
let linked = 1

const fillSpeakersTranslatorsAndLinkWithEvent = [
    'iterate over old-contents where {$exist: event_id} as old-content. Get 25 at a time. Flush every 5 cycles. Wait for 100 millis', [

        'get event *old-content.event_id',
        'if *event is empty, display "empty event", *old-content.event_id',
        'if *event is empty, stop here',
        'search old-content-to-audio-channel where {content_id: *old-content._id} as cac',
        'async each *cac.hits.hits as old-content-to-audio-channel', [
            'get old-audio-channel *old-content-to-audio-channel.audiochannel_id as old-audio-channel', //No need to mention _source or fields. Both places, including top level object will be checked for existence of audiochannelId field

            'search first person where {_id: *old-audio-channel.speaker_id} as person.', //Creates person in index if not found there. Also sets person entity viz id+type as key in ctx.data, query as key with value being result in ctx.data

            //Handle event.speakers/translators. This guy is either a speaker or a translator. Set the relevent linking

            //Initializers
            'roleType is speaker if *old-audio-channel.translation_type is empty. Else is translator',
            'roleFeatures are {person._id: *old-audio-channel.speaker_id, primaryLanguages._id: *old-audio-channel.language_id}',
            (ctx) => {
                //TODO fix this 'roleFeatures.translationType is *old-audio-channel.translation_type if *roleType is translator.',
                if (ctx.get('roleType') === 'translator') {
                    const translationType = ctx.get('old-audio-channel')._source.translation_type
                    ctx.get('roleFeatures').translationType = translationType
                }
                return ctx
            },
            'search first *roleType where *roleFeatures as speakerOrTranslator. Create if not exists.',
            'if *speakerOrTranslator is empty, display "empty speaker", *roleFeatures, *roleType',
            'if *speakerOrTranslator is empty, stop here',
            (ctx) => {
                const speaker = ctx.get('speakerOrTranslator')
                const speakerBody = speaker._source || speaker.fields
                const pmName = _.get(_.first(speakerBody.primaryLanguages), 'fields.english.name')
                if (_.isObject(pmName)) {
                    debug('hai hai', JSON.stringify(speaker))
                    throw new Error('stopHere')
                }
            },
            //'display *roleType, *speakerOrTranslator._id, *roleFeatures',
            'link *speakerOrTranslator with *event as events',
        ],
    ],
    () => debug('Done ' + n++ + ' iterations')
]

const copyPersons = [
    'iterate over old-persons as old-person. Get 500 at a time. Flush at end.', [
        'newPerson is {_id: *old-person._id, _type: person, english.name: *old-person.english.name, tibetan.name: *old-person.tibetan.name}',
        'index *newPerson'
    ]
]

const copyLanguages = [
    'iterate over old-languages as old-language. Get 5 at a time. Flush at end', [
        'newLanguage is {_id: *old-language._id, _type: language, english.name: *old-language.english.name, tibetan.name: *old-language.tibetan.name}',
        'index *newLanguage'
    ]
]

const migrateEvents = [
    'iterate over old-events as old-event. Get 100 at a time. Flush every 2 cycles. Wait for 300 millis', [
        'newEvent is {_id: *old-event._id, _type: event, tibetan.description: *old-event.tibetan.description, english.description: *old-event.english.description, startingDate: *old-event.date_start, endingDate: *old-event.date_end, urls: *old-event.urls, english.archiveNotes: *old-event.archive_notes}',
        'index *newEvent'
    ]
]
const linkEventWithLocationsAndClassifications = [
    'iterate over old-events as old-event. Get 100 at a time. Flush every 2 cycles. Wait for 300 millis.', [
        'newEvent is {_id: *old-event._id, _type: event}',
        'get event *old-event._id as newEvent',
        'if *newEvent is empty, display *old-event, "please create this event"',
        'if *newEvent is empty, stop here',
        'if *old-event.event_type_id is not empty, get classification *old-event.event_type_id as classification',
        'if *classification is not empty, link *classification with *newEvent as events',
        'if *old-event.location_id is not empty, get location *old-event.location_id as location',
        'if *location is not empty, link *location with *newEvent as events',
    ]
]
const migrateClassifications = [
    'iterate over old-event-types as old-classification. Get 100 at a time.', [
        'newClassification is {_id: *old-classification._id, _type: classification, english.name: *old-classification.english.name, tibetan.name: *old-classification.tibetan.name}',
        'index *newClassification',
        //(ctx) => debug(ctx.newClassification)
    ]
]

const migrateLocations = [
    'iterate over old-locations as old-location. Get 100 at a time. Flush at end.', [
        'newLocation is {_id: *old-location._id, _type: location, english.name: *old-location.english.name, english.hierarchicalName: *old-location.name_english_hierarchy_c, tibetan.name: *old-location.tibetan.name, english.type: *old-location.locationType}',
        'index *newLocation',
    ],
]

const copyLocationType = [
    'iterate over old-locations as old-location. Get 100 at a time. Flush at end.', [
        'get location *old-location._id as location',
        'location.type is *old-location.locationType',
        'display *location, *old-location.locationType'
    ]

]

const linkLocationsWithParent = [
    //Now set parent relationships
    'iterate over old-locations as oldLocation. Get 100 at a time. Flush every 2 cycles. Wait for 300 millis.', [
        'if *oldLocation.parent_id is empty, stop here.',
        'get location *oldLocation._id as newLocation',
        'get location *oldLocation.parent_id as parentLocation',
        (ctx) => { if (!ctx.get('parentLocation')) debug('no parentLocation found for', ctx.get('newLocation')._id) },
        'if *parentLocation is empty, stop here',
        'if *newLocation is empty, stop here',
        'link *newLocation with *parentLocation as parent'
    ],
]

const formFactorToTypeMapping = {
    '120mm Optical Disc': 'optical-drive',
    '64mm Magneto-Optical Cartridge': 'optical-drive',
    'Tape': 'tape',
    'Hard Drive': 'hd'
}
const migratePhysicalMedia = [
    'iterate over old-physical-medias as oldPm. Get 25 at a time. Flush every 5 cycles. Wait for 300 millis', [
        'if *oldPm.physicalmedia_form_id is empty, stop here',
        'get physical-media-form *oldPm.physicalmedia_form_id as physicalMediaForm',
        (ctx) => {
            if (ctx.get('physicalMediaForm')) {

                const pmForm = ctx.get('physicalMediaForm')
                const formFactor = _.get(pmForm, '_source.formFactor') || _.get(pmForm, 'fields.formFactor')
                ctx = ctx.setImmutable('newPhysicalMediaType', formFactorToTypeMapping[formFactor])

            } else if (ctx.get('oldPm._source.spreadsheet_temp') === "minidv") {

                ctx = ctx.setImmutable('newPhysicalMediaType', 'tape')

            } else {
                debug('unknown form', ctx.get('oldPm'))
                throw new Error('stopHere')
            }
            return ctx //The next instruction will now get the new ctx object
        },
        'newPhysicalMedia is {_id: *oldPm._id, _type: *newPhysicalMediaType, name: *oldPm.label, physicalMediaFormat._id: *oldPm.physicalmedia_format_id, physicalMediaForm._id: *oldPm.physicalmedia_form_id, volumeName: *oldPm.volume_name, serialNumer: *oldPm.serial_number, brand: *oldPm.brand, capacity: *oldPm.capacity, duration: *oldPm.duration, datePurchased: *oldPm.date_purchase, dateRecorded: *oldPm.date_recorded, dateChecked: *oldPm.date_checked, checkStatus: *oldPm.check_status, cost: *oldPm.cost, location._id: *oldPm.location_id, english.archiveNotes: *oldPm.archive_notes, lastImported: *oldPm.last_imported, english.description: *oldPm.description_eng_temp, tibetan.description: *oldPm.description_eng_tibetan, valueListName: *oldPm.valuelistname_c}',
        'index *newPhysicalMedia'
    ],

]

const migratePhysicalMediaFormat = [
    'iterate over old-physical-media-formats as oldFormat. Get 100 at a time.', [
        'newFormat is {_id: *oldFormat._id, _type: physical-media-format, name: *oldFormat.name, description: *oldFormat.description}',
        'index *newFormat'
    ]
]
const migratePhysicalMediaForm = [
    'iterate over old-physical-media-forms as oldForm. Get 100 at a time.', [
        'newForm is {_id: *oldForm._id, _type: physical-media-form, name: *oldForm.name, description: *oldForm.description, signal: *oldForm.signal, formFactor: *oldForm.form_factor}',
        'index *newForm'
    ]
]

const copyRoles = [
        'iterate over old-roles as old-role. Get 10 at a time', [
            'newRole is {_id: *old-role._id, _type: role, english.name: *old-role.name, tibetan.name: *old-role.name}',
            'index *newRole'
        ]
    ]
    /**
    		'get person *old-c2p.person_id',
    		'if *person is empty, display "person not found", *old-c2p.person_id, "content_id", *old-c2p.content_id',
    		'if *person is empty, stop here',
    		'get role *old-c2p.role_id',
    		'if *role is empty, display "role not found", *old-c2p.role_id',
    		'if *role is empty, stop here',
    **/
const linkPersonRoleWithEvent = [
    'iterate over old-content-to-persons as old-c2p. Get 50 at a time. Flush every 5 cycles. Wait for 300 millis', [
        'search first old-content where {$exist: event_id, _id: *old-c2p.content_id} as content',
        'if *content is empty, display "no content found for id", *old-c2p.content_id, "content-to-person id", *old-c2p._id',
        'if *content is empty, stop here',
        'get event *content.event_id',
        'if *event is empty, display "event not found", *content.event_id, "content_id", *content._id',
        'if *event is empty, stop here',
        'if *old-c2p.person_id is empty, stop here',
        'get person *old-c2p.person_id',
        'if *person is empty, display "person not found. This content will be ignored", *old-c2p.person_id, "content_id", *old-c2p.content_id',
        'if *person is empty, stop here',
        'search first person-role where {person._id: *old-c2p.person_id, role._id: *old-c2p.role_id}. Create if not exists.',
        'link *person-role with *event as events'
    ]

]
const linkEventWithPhysicalMedia = [
    'iterate over old-contents where {$exist: event_id} as old-content. Get 25 at a time. Flush every 5 cycles. Wait for 300 millis', [
        'search old-copy where {content_id: *old-content._id} as old-copies',
        'async each *old-copies.hits.hits as old-copy', [
            'if *old-copy.physicalmedia_id is empty, stop here',
            'get old-physical-media *old-copy.physicalmedia_id as oldPhysicalMedia',
            'get physical-media-form *oldPhysicalMedia.physicalmedia_form_id as physicalMediaForm',
            (ctx) => {
                const formFactor = ctx.get('physicalMediaForm._source.formFactor')
                return ctx.setImmutable('newPhysicalMediaType', formFactorToTypeMapping[formFactor])
            },
            'get *newPhysicalMediaType *oldPhysicalMedia._id as physicalMedia',
            'if *physicalMedia is empty, display *oldPhysicalMedia._id, "missing pm", *newPhysicalMediaType',
            'if *physicalMedia is empty, stop here',
            'get event *old-content.event_id',
            'if *event is empty, display *old-content.event_id, "missing event"',
            'if *event is empty, stop here',
            'link *physicalMedia with *event as events',
        ]
    ]
]


const done = () => debug('done')

const executeOneByOne = (instructions, ctx) => {
    return async.eachSeries((instructions), (instruction) => {
        return es.dsl.execute(instruction, ctx)
            .then(() => ctx.flush(true) && debug('flush', instruction))
    })
}

if (require.main === module) {
    const ctx = new es.Cache(es, {})

    //const profiler = require('./profiler')
    //const profileId = process.argv[3] || 'default'
    //profiler.init('/Users/namgyal/NewDatabase/DalaiLama/backend/app/dbMigration/profiler', profileId)
    //setTimeout(() => profiler.stop(profileId), 30000)
    const instructions = [
        /**migrateLocations, 
    linkLocationsWithParent,
		migrateClassifications,
    copyLanguages,
    copyPersons,
		migrateEvents,**/
        //fillSpeakersTranslatorsAndLinkWithEvent,
        //linkEventWithLocationsAndClassifications,
        /**migratePhysicalMediaForm,
        migratePhysicalMedia,
        migratePhysicalMediaFormat,
        linkEventWithPhysicalMedia,**/
        //copyRoles,
        //linkPersonRoleWithEvent,
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