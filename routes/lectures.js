'use strict';

var router = require('express').Router();
var moment = require('moment');
var Lecture = require('../models/model_lecture');
var User = require('../models/model_user');

// on routes that end in /lectures
router.route('/')

    /*
     * Returns all lectures.
     */
    .get(function(req, res) {
        Lecture.find({}).sort({startTime: 1}).limit(100).exec(function(err, lectures) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(lectures);
            res.end();
        });
    });

// on routes that end in /lectures/users/:user_id
router.route('/users/:user_id')

    /*
     * Returns all upcoming lectures for the given user id.
     */
    .get(function(req, res, next) {

        var startTime;
        if (req.query.weekly === "true") {
            startTime = moment().day(1);
            startTime.hour(0);
            startTime.minute(0);
            startTime.seconds(0);
        } else {
            // today at 0:00
            startTime = new Date();
            startTime.setHours(0,0,0,0);
        }

        var laterDate = new Date();    
        laterDate.setDate(laterDate.getDate() + 21);

        // get the users selected lectures
        User.findOne({'deviceId': req.params.user_id}, function(err, user) {
            if (err) {
                next(err);
                return;
            }

            if (!user) {
                var noUserErr = new Error();
                noUserErr.status = 404;
                noUserErr.message = "User ID not found.";
                next(noUserErr);
                return;
            }

            var selectedLectures = user.selectedLectures.toObject();
            var selectedGroupsArr = [];
            var selectedLecturesArr = [];

            for (var i = 0; i < selectedLectures.length; i++) {
                selectedGroupsArr.push(selectedLectures[i].groupName);
                selectedLecturesArr.push(selectedLectures[i].lectureName);
            }

            var query = {groups: {$in: selectedGroupsArr}, lectureName: {$in: selectedLecturesArr}, startTime: {'$gte': startTime, '$lte': laterDate}, canceled: false};

            Lecture.find(query).sort({startTime: 1}).exec(function(err, lectures) {
                if (err) { next(err); return; }
                res.status(200).json(lectures);
                res.end();
            });
        });
    });


// on routes that end in /lectures/upcoming
// this returns all lectures since monday of the current week
router.route('/upcoming')

    // get upcoming lectures (GET /$apiBaseUrl/lectures/upcoming)
    .post(function(req, res) {
        var mon = moment().day(1);
        mon.hour(0);
        mon.minute(0);
        mon.seconds(0);

        var reqGroups = JSON.parse(req.body.groups || '[]');
        var query = { groups: { $in: reqGroups }, 'startTime': {'$gte': mon}, canceled: false};

        // if no reqGroups provided, return all lectures
        if (reqGroups.length === 0) {
            delete query.groups;
        }

        // check if we got a proper array
        if (reqGroups) {
            Lecture.find(query).sort({startTime: 1}).limit(100).exec(function(err, lectures) {
                if (err) { res.status(500).send(err + ' - data was: ' + reqGroups);  }
                res.status(200).json(lectures);
                res.end();
            });
        } else {
            res.status(400).json({ error: 'ohh that query looks wrong to me: ' + reqGroups });
            return;
        }
    });


// on routes that end in /lectures/groups
router.route('/groups')

    // get lectures for specific groups (POST /$apiBaseUrl/lectures/groups)
    .post(function(req, res) {

        // today at 0:00
        var today = new Date();
        today.setHours(0,0,0,0);

        var reqGroups = JSON.parse(req.body.groups || '[]');
        var query = { groups: { $in: reqGroups }, 'endTime': {'$gte': today}, canceled: false};

        // if no reqGroups provided, return all lectures
        if (reqGroups.length === 0) {
            delete query.groups;
        }

        // check if we got a proper array
        if (reqGroups) {
            Lecture.find(query).sort({startTime: 1}).limit(100).exec(function(err, lectures) {
                if (err) { res.status(500).send(err + ' - data was: ' + reqGroups);  }
                res.status(200).json(lectures);
                res.end();
            });
        } else {
            res.status(400).json({ error: 'ohh that query looks wrong to me: ' + reqGroups });
            return;
        }
    });


// on routes that end in /lectures/weekly
router.route('/weekly')

    // get lectures for specific groups (POST /$apiBaseUrl/lectures/groups)
    .post(function(req, res) {

        var mon = moment().day(1);
        mon.hour(0);
        mon.minute(0);
        mon.seconds(0);
        var sun = moment().day(7);
        sun.hour(23);
        sun.minute(59);
        sun.seconds(59);

        var reqGroups = JSON.parse(req.body.groups || '[]');
        var query = { groups: { $in: reqGroups }, 'startTime': {'$gte': mon}, 'endTime': {'$lte': sun}, canceled: false};

        // if no reqGroups provided, return all lectures
        if (reqGroups.length === 0) {
            delete query.groups;
        }

        // check if we got a proper array
        if (reqGroups) {
            Lecture.find(query).sort({startTime: 1}).limit(100).exec(function(err, lectures) {
                if (err) { res.status(500).send(err + ' - data was: ' + reqGroups);  }
                res.status(200).json(lectures);
                res.end();
            });
        } else {
            res.status(400).json({ error: 'ohh that query looks wrong to me: ' + reqGroups });
            return;
        }
    });


// on routes that end in /lectures/:lecture_id
router.route('/:lecture_id')

    // get lecture with that id (GET /$apiBaseUrl/lectures/:lecture_id)
    .get(function(req, res) {
        Lecture.findById(req.params.lecture_id, function(err, lecture) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(lecture);
            res.end();
        });
    });


module.exports = router;
