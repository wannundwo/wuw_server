"use strict";

var mongoose = require("mongoose");
var utils = require("../utils");

// create mongodb schema for our users
var UserSchema = new mongoose.Schema({
    deviceId: String,
    plattform: String,
    pushToken: String,
    firstSeen: Date,
    lastSeen: Date
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});


// create model from our schema & export it
module.exports = mongoose.model("User", UserSchema, "users");
