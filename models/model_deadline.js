'use strict';

var mongoose = require('mongoose');
var utils = require('../wuw_utils');

module.exports = function(dbCon) {

    // create mongodb schema for our deadlines
    var DeadlineSchema = new mongoose.Schema({
        info: String,
        deadline: Date,
        shortLectureName: String,
        group: {
            groupName: String,
            lectureName: String
        },
        createdBy: String
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

    // add a virtual function for color generation
    DeadlineSchema.virtual('color').get(function () {
        return utils.stringToColor(this.group.lectureName);
    });

    // choose connection
    var con = dbCon ? dbCon : mongoose;
    // return a model
    return con.model('Deadline', DeadlineSchema, 'deadlines');
};
