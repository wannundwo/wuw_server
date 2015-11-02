'use strict';

var router = require('express').Router();
var Events = require('../models/model_event');


// on routes that end in /events
router.route('/')

    /*
     * Returns all events since today 00:00 o'clock.
     */
    .get(function(req, res) {

        // today at 0:00
        var today = new Date();
        today.setHours(0,0,0,0);

        // get all upcoming entries
        Events.find({'startTime': {'$gte': today}}).sort({startTime: 1}).limit(60).exec(function(err, events) {
            if (err) { next(err); return; }
            res.status(200).json(events);
            res.end();
        });
    });

module.exports = router;
