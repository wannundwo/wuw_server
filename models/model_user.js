'use strict';

var mongoose = require('mongoose');
var utils = require('../wuw_utils');

module.exports = function(dbCon) {

    // create a schema for our embedded document
    var selectedLecturesSchema = new mongoose.Schema({
        groupName: String,
        lectureName: String
    }, {
        _id: false
    });

    // create mongodb schema for our users
    var UserSchema = new mongoose.Schema({
        deviceId: String,
        selectedLectures: [selectedLecturesSchema],
        platform: String,
        platformVersion: String,
        pushToken: String,
        appVersion: String,
        firstSeen: Date,
        lastSeen: Date
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

    // choose connection
    //var con = dbCon ? dbCon : mongoose;
    // return a model
    return mongoose.model('User', UserSchema, 'users');
};
