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
                var count = Array.apply(null, Array(10)).map(Number.prototype.valueOf,0);

                if(usedRooms[0] && usedRooms[0].rooms) {
                    shuffle(rooms[0].rooms);
                    freeRooms = rooms[0].rooms.filter(function(e) {
                        var building = e.split("/")[0];
                        if(e && (e.match(/\d\/\d\d\d ?.*/)) && usedRooms[0].rooms.indexOf(e) < 0) {
                            count[building] = (count[building] + 1);
                            return (count[building] <= 10);
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

/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 * @return {Array} a The shuffled array
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}

module.exports = router;
