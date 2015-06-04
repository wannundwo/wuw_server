'use strict';

var mongoose = require('mongoose');
var utils = require('../wuw_utils');

module.exports = function(dbCon) {

    // create mongodb schema for our lectures
    var LectureSchema = new mongoose.Schema({
        lectureName: String,
        rooms: [String],
        groups: [String],
        startTime: Date,
        endTime: Date,
        docents: [String]
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

    // add a virtual function for color generation
    LectureSchema.virtual('color').get(function () {
        return utils.stringToColor(this.lectureName);
    });

    // choose connection
    var con = dbCon ? dbCon : mongoose;
    // return a model
    return mongoose.model('Lecture', LectureSchema, 'lectures');
};
