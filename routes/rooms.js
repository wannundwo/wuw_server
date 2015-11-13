'use strict';

var router = require('express').Router();
var Lecture = require('../models/model_lecture');

// on routes that end in /rooms
router.route('/')

    /*
     * Returns all rooms, if free or not doesn't matter.
     */
    .get(function(req, res) {
        // querys for all rooms and aggregate to one doc
        Lecture.aggregate([ { $unwind: '$rooms' }, { $group: { _id: 'rooms', rooms: { $addToSet: '$rooms' } } } ]).exec(function(err, rooms) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(rooms[0].rooms);
            res.end();
        });
    });

// on routes that end in /rooms/free
router.route('/free')

    /*
     * Returns all rooms, which are based on our information, should be free.
     */
    .get(function(req, res, next) {

        // get all rooms (in db)
        Lecture.aggregate([ { $unwind: '$rooms' }, { $group: { _id: 'rooms', rooms: { $addToSet: '$rooms' } } } ]).exec(function(err, rooms) {
            if (err) { next(err); return; }

            // get rooms currently in use
            Lecture.aggregate([ { $match: { startTime: { '$lte': new Date() }, endTime: { '$gte': new Date() } } }, { $unwind: '$rooms' }, { $group: { _id: 'rooms', rooms: { $addToSet: '$rooms' } } } ]).exec(function(err, usedRooms) {
                if (err) { next(err); return; }

                // filter used rooms by comparing both arrays
                var freeRooms;
                if(usedRooms[0] && usedRooms[0].rooms) {
                    freeRooms = rooms[0].rooms.filter(function(e) {
                        if(e) {
                            return (e.match(/\d\/\d\d\d ?.*/) && usedRooms[0].rooms.indexOf(e) < 0);
                        }
                    });
                } else {
                    // all rooms free
                    freeRooms = rooms[0].rooms;
                }

                // js sorting, maybe do it on mongo
                freeRooms = freeRooms.sort();

                res.status(200).json(freeRooms);
                res.end();
            });
        });
    });

module.exports = router;
