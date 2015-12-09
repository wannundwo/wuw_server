'use strict';

var mongoose = require('mongoose');
var utils = require('../wuw_utils');

// create mongodb schema for our events
var EventSchema = new mongoose.Schema({
    title: String,
    url: String,
    descr: String,
    contact: String,
    location: String,
    startTime: Date,
    // if starttime is set to 01:00, we don't want to display the time, only the date
    hasTime: {type: Boolean, default: true},
    endTime: Date,
    created: Date,
    modified: Date
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

EventSchema.virtual('color').get(function () {
    return utils.stringToColor(this.title);
});

// create model from our schema & export it
module.exports = mongoose.model('Event', EventSchema, 'events');
