'use strict';

// old /groupLectures is now /groups/lectures !!!

// import the express router
var router = require('express').Router();

// create model
var Lecture = require('../models/model_lecture');
var User = require('../models/model_user');


// on routes that end in /groups
router.route('/')

    // get all groups (GET /$apiBaseUrl/groups)
    .get(function(req, res) {
        // querys for all groups and aggregate to one doc
        Lecture.aggregate([ { $unwind: '$groups' }, { $group: { _id: 'groups', groups: { $addToSet: '$groups' } } } ]).exec(function(err, groups) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(groups[0].groups);
            res.end();
        });
    });


// on routes that end in /groupLectures
router.route('/lectures')
    // get all groups with their lectures (GET /$apiBaseUrl/groupLectures)
    .get(function(req, res) {
        // querys for all groups & their lectures and aggregate
        Lecture.aggregate( [ { $unwind: '$groups' }, { $group: { _id: '$groups', lectures: { $addToSet: '$lectureName' } } }, {$sort: { _id: 1}} ] ).exec(function(err, groups) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(groups);
            res.end();
        });
    });

/*
 * Returns all available Groups with its lectures
 * with markers which groups & lectures are selected by the given user
 */
router.route('/lectures/:user_id')
    .get(function(req, res) {

        // querys for all groups & their lectures and aggregate
        Lecture.aggregate( [ { $unwind: '$groups' }, { $group: { _id: '$groups', lectures: { $addToSet: '$lectureName' } } }, {$sort: { _id: 1}} ] ).exec(function(err, groups) {
            if (err) { res.status(500).send(err); }

            // get the users selected lectures
            User.findOne({'deviceId': req.params.user_id}, function(err, user) {
                if (user == null) {
                    res.status(500).send("user id not found");
                }

                var usersSelectedLectures = user.selectedLectures;

                for (var i = 0; i < groups.length; i++) {
                    // find out how many lectures the user has selected in this group
                    var lecturesInGroupCounter = 0;
                    for (var j = 0; j < usersSelectedLectures.length; j++) {
                        if (groups[i]._id === usersSelectedLectures[j].groupName) {
                            lecturesInGroupCounter++;
                        }
                    }
                    groups[i].lecturesSelectedByUser = lecturesInGroupCounter;

                    // mark every lecture which the user has selected as selected;
                    var lecturesInGroup = groups[i].lectures;
                    for (var j = 0; j < lecturesInGroup.length; j++) {
                        lecturesInGroup[j] = {lectureName: lecturesInGroup[j] , selectedByUser: false}
                        // search this lecture in the users selected lectures
                        for (var k = 0; k < usersSelectedLectures.length; k++) {
                            if (lecturesInGroup[j].lectureName === usersSelectedLectures[k].lectureName &&
                                groups[i]._id === usersSelectedLectures[k].groupName)
                            {
                                lecturesInGroup[j].selectedByUser = true;
                            }
                        }
                    }
                }

                res.status(200).json(groups);
                res.end();
            });
        });
    });


module.exports = router;
