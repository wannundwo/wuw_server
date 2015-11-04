'use strict';

var util = require('util');
var router = require('express').Router();
var User = require('../models/model_user');

// on routes that end in /users
router.route('/:deviceId/lectures')

    /*
     * Creates an user, and/or updates his selected lectures.
     */
    .post(function(req, res, next) {
        // create instance of User model
        var user = new User();

        // check inputs
        req.assert('deviceId', 'deviceId must not be empty').notEmpty();
        req.assert('platform', 'platform must not be empty').notEmpty();
        req.assert('platformVersion', 'platformVersion must not be empty').notEmpty();
        req.assert('appVersion', 'appVersion must not be empty').notEmpty();

        // if there are validation errors, send a 400 resposne with corresponding validation information
        var validationErrors = req.validationErrors(true);
        if (validationErrors) {
            var err = new Error();
            err.status = 400;
            err.message = validationErrors;
            next(err);
            return;
        }

        var now = new Date();

        // set attributes
        user.deviceId = req.body.deviceId;
        user.platform = req.body.platform;
        user.platformVersion = req.body.platformVersion;
        user.pushToken = req.body.pushToken;
        user.appVersion = req.body.appVersion;
        user.selectedLectures = JSON.parse(req.body.selectedLectures);
        user.lastSeen = now;

        // create an object from our document
        var upsertData = user.toObject();
        // delete attributes to upsert
        delete upsertData._id;
        delete upsertData.firstSeen;

        // upsert in db
        User.update({ deviceId: user.deviceId }, { $setOnInsert: { firstSeen: now }, $set: upsertData }, { upsert: true }, function(err, user) {
            if (err) { next(err); return; }
            res.status(200).json({ message: 'successful!', id: user._id });
            res.end();
        });
    });

module.exports = router;
