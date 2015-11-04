'use strict';

var util = require('util');
var router = require('express').Router();
var Deadline = require('../models/model_deadline');
var User = require('../models/model_user');

// on routes that end in /deadlines/user/:user_id
router.route('/user/:user_id')

    /*
     * Returns all deadlines for the given user.
     */
    .get(function(req, res, next) {

        // get date of yesterday
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // get the users selected lectures
        User.findOne({'deviceId': req.params.user_id}, function(err, user) {
            if (err) { next(err); return; }
            if (!user) {
                var noUserErr = new Error();
                noUserErr.status = 404;
                noUserErr.message = "User ID not found.";
                next(noUserErr);
                return;
            }

            var selectedLectures = user.selectedLectures.toObject();
            var query = {group: {$in: selectedLectures}, 'deadline': {'$gte': yesterday}};
            Deadline.find(query).exec(function(err, deadlines) {
                if (err) { next(err); return; }
                res.status(200).json(deadlines);
                res.end();
            });
        });
    });


// on routes that end in /deadlines
router.route('/')

    /*
     * Returns all "active" deadlines.
     */
    .get(function(req, res, next) {

        // get date of yesterday
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // all 'active' deadlines
        Deadline.find({'deadline': {'$gte': yesterday}}).sort({deadline: 1}).limit(25).exec(function(err, deadlines) {
            if (err) { next(err); return; }
            res.status(200).json(deadlines);
            res.end();
        });
    })

    /*
     * Creates a deadline.
     */
    .post(function(req, res, next) {
        // create instance of Deadline model
        var deadline = new Deadline();

        // check inputs
        req.assert('deadline', 'deadline must be a valid date').isDate();
        req.assert('deadline', 'deadline must not be empty').notEmpty();
        req.assert('info', 'info must not be empty').notEmpty();
        //req.assert('shortLectureName', 'shortLectureName must not be empty').notEmpty();
        req.assert('group.groupName', 'groupName must not be empty').notEmpty();
        req.assert('group.lectureName', 'lectureName must not be empty').notEmpty();
        req.assert('uuid', 'createdBy must not be empty').notEmpty();

        // if there are validation errors, send a 400 resposne with corresponding validation information
        var validationErrors = req.validationErrors(true);
        if (validationErrors) {
            var err = new Error();
            err.status = 400;
            err.message = validationErrors;
            next(err);
            return;
        }

        // set the deadline attributes
        deadline.deadline = req.body.deadline;
        deadline.info = req.body.info;
        deadline.group.groupName = req.body.group.groupName;
        deadline.group.lectureName = req.body.group.lectureName;
        deadline.createdBy = req.body.uuid;

        // save deadline in mongodb
        deadline.save(function(err, deadline) {
            if (err) { next(err); return; }
            res.status(200).json({ message: 'Deadline created!', id: deadline.id });
        });
    });

module.exports = router;
