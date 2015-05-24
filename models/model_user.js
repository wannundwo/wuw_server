"use strict";

var mongoose = require("mongoose");
var utils = require("../utils");

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


// create model from our schema & export it
module.exports = mongoose.model("User", UserSchema, "users");
