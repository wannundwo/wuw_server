'use strict';

var util = require('util');

// import the express router
var router = require('express').Router();

// create model
var User = require('../models/model_user');


// on routes that end in /users
router.route('/:deviceId/lectures')

    // create a user (POST /$apiBaseUrl/users)
    .post(function(req, res) {
        // create instance of User model
        var user = new User();

        // check inputs
        req.assert('deviceId', 'deviceId must not be empty').notEmpty();
        req.assert('platform', 'platform must not be empty').notEmpty();
        req.assert('platformVersion', 'platformVersion must not be empty').notEmpty();
        req.assert('appVersion', 'appVersion must not be empty').notEmpty();

        // if there are errors, send 400
        var errors = req.validationErrors(true);
        if (errors) {
            res.status(400).send('There have been validation errors: ' + util.inspect(errors));
            return;
        }

        var now = new Date();

        // set attributes
        user.deviceId = req.body.deviceId;
        user.platform = req.body.platform;
        user.platformVersion = req.body.platformVersion;
        user.pushToken = req.body.pushToken;
        user.appVersion = req.body.appVersion;
        user.selectedLectures = req.body.selectedLectures;
        user.lastSeen = now;

        // create an object from our document
        var upsertData = user.toObject();
        // delete attributes to upsert
        delete upsertData._id;
        delete upsertData.firstSeen;

        // upsert in db
        User.update({ deviceId: user.deviceId }, { $setOnInsert: { firstSeen: now }, $set: upsertData }, { upsert: true }, function(err, user) {
            if (err) { res.send(err); }
            res.status(200).json({ message: 'successful!', id: user._id });
            res.end();
        });
    });


// // on routes that end in /users/:userDevId/lectures
// router.route('/:deviceId/lectures')
//
//     // post selectedLectures for server-side storing (GET /$apiBaseUrl/users/:ldeviceId/lectures)
//     .post(function(req, res) {
//         var deviceId = req.params.deviceId;
//         var selectedLectures = req.body.selectedLectures;
//
//         User.find({deviceId: deviceId}, function(err, user) {
//
//             if (err) {
//                 //res.status(500).send(err);
//                 res.status(500).send({ message: 'error!' });
//                 res.end();
//             } else {
//                 // update users selectedLectures
//                 User.update({ deviceId: deviceId }, { $set: { selectedLectures: selectedLectures } }, function(err, user) {
//                     if (err) {
//                         //res.status(500).send(err);
//                         res.status(500).send({ message: 'error!' });
//                     } else {
//                         res.status(200).json({ message: 'successful!', id: user._id });
//                     }
//                     res.end();
//                 });
//             }
//         });
//     });

module.exports = router;
