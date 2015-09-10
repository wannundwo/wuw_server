'use strict';

// import the express router
var router = require('express').Router();

// create model
var Events = require('../models/model_event');


// route /events
router.route('/')

    // GET
    .get(function(req, res) {

        // today at 0:00
        var today = new Date();
        today.setHours(0,0,0,0);

        // get all upcoming entries
        Events.find({'startTime': {'$gte': today}}).sort({startTime: 1}).limit(60).exec(function(err, events) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(events);
            res.end();
        });
    });


// route /events/:event_id
router.route('/:event_id')

    // get item by id
    .get(function(req, res) {
        Events.findById(req.params.event_id, function(err, event) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(event);
            res.end();
        });
    });


module.exports = router;
