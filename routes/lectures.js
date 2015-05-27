"use strict";

// old /upcomingLectures is now /lectures/upcoming !!!
// old /lecturesForGroups is now /lectures/groups !!!

// import the express router
var router = require("express").Router();

var moment = require("moment");

// create model
var Lecture = require("../models/model_lecture");
var User = require("../models/model_user");


// on routes that end in /lectures
router.route("/")

    // get all lectures (GET /$apiBaseUrl/lectures)
    .get(function(req, res) {
        Lecture.find({}).sort({startTime: 1}).limit(100).exec(function(err, lectures) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(lectures);
            res.end();
        });
    });

// on routes that end in /lectures/user/:user_id
router.route("/user/:user_id")

    // get all lectures (GET /$apiBaseUrl/lectures)
    .get(function(req, res) {
        
        // get monday of the current week
        var mon = moment().day(1);
        mon.hour(0);
        mon.minute(0);
        mon.seconds(0);
        
        // get the users selected lectures
        User.findOne({'deviceId': req.params.user_id}, function(err, user) {
            if (err) { res.status(500).send(err); }
            if (user === null) { res.status(500).send("deviceId not found"); return;}
            
            var selectedLectures = user.selectedLectures.toObject();
            var selectedGroupsArr = [];
            var selectedLecturesArr = [];
            
            for (var i = 0; i < selectedLectures.length; i++) {
                selectedGroupsArr.push(selectedLectures[i].groupName);
                selectedLecturesArr.push(selectedLectures[i].lectureName);
            }
            
            var query = {groups: {$in: selectedGroupsArr}, 
                         lectureName: {$in: selectedLecturesArr}, 
                         startTime: {"$gte": mon}};
                         
            Lecture.find(query).exec(function(err, lectures) {
                if (err) { res.status(500).send(err); }
                res.status(200).json(lectures);
                res.end();
            });
        });
    });


// on routes that end in /lectures/upcoming
// this returns all lectures since monday of the current week
router.route("/upcoming")

    // get upcoming lectures (GET /$apiBaseUrl/lectures/upcoming)
    .post(function(req, res) {
        var mon = moment().day(1);
        mon.hour(0);
        mon.minute(0);
        mon.seconds(0);

        var reqGroups = JSON.parse(req.body.groups || "[]");
        var query = { groups: { $in: reqGroups }, "startTime": {"$gte": mon}};

        // if no reqGroups provided, return all lectures
        if (reqGroups.length === 0) {
            delete query.groups;
        }

        // check if we got a proper array
        if (reqGroups) {
            Lecture.find(query).sort({startTime: 1}).limit(100).exec(function(err, lectures) {
                if (err) { res.status(500).send(err + " - data was: " + reqGroups);  }
                res.status(200).json(lectures);
                res.end();
            });
        } else {
            res.status(400).json({ error: "ohh that query looks wrong to me: " + reqGroups });
            return;
        }
    });


// on routes that end in /lectures/groups
router.route("/groups")

    // get lectures for specific groups (POST /$apiBaseUrl/lectures/groups)
    .post(function(req, res) {

        // today at 0:00
        var today = new Date();
        today.setHours(0,0,0,0);

        var reqGroups = JSON.parse(req.body.groups || "[]");
        var query = { groups: { $in: reqGroups }, "endTime": {"$gte": today}};

        // if no reqGroups provided, return all lectures
        if (reqGroups.length === 0) {
            delete query.groups;
        }

        // check if we got a proper array
        if (reqGroups) {
            Lecture.find(query).sort({startTime: 1}).limit(100).exec(function(err, lectures) {
                if (err) { res.status(500).send(err + " - data was: " + reqGroups);  }
                res.status(200).json(lectures);
                res.end();
            });
        } else {
            res.status(400).json({ error: "ohh that query looks wrong to me: " + reqGroups });
            return;
        }
    });


// on routes that end in /lectures/weekly
router.route("/weekly")

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

        var reqGroups = JSON.parse(req.body.groups || "[]");
        var query = { groups: { $in: reqGroups }, "startTime": {"$gte": mon}, "endTime": {"$lte": sun}};

        // if no reqGroups provided, return all lectures
        if (reqGroups.length === 0) {
            delete query.groups;
        }

        // check if we got a proper array
        if (reqGroups) {
            Lecture.find(query).sort({startTime: 1}).limit(100).exec(function(err, lectures) {
                if (err) { res.status(500).send(err + " - data was: " + reqGroups);  }
                res.status(200).json(lectures);
                res.end();
            });
        } else {
            res.status(400).json({ error: "ohh that query looks wrong to me: " + reqGroups });
            return;
        }
    });


// on routes that end in /lectures/:lecture_id
router.route("/:lecture_id")

    // get lecture with that id (GET /$apiBaseUrl/lectures/:lecture_id)
    .get(function(req, res) {
        Lecture.findById(req.params.lecture_id, function(err, lecture) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(lecture);
            res.end();
        });
    });


module.exports = router;
