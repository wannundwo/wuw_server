'use strict';

var mongoose = require('mongoose');
var utils = require('../wuw_utils');

// create mongodb schema for our news
var NewsSchema = new mongoose.Schema({
    title: String,
    url: String,
    descr: String,
    text: String,
    created: Date,
    modified: Date
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

NewsSchema.virtual('color').get(function () {
    return utils.stringToColor(this.title);
});

// create model from our schema & export it
module.exports = mongoose.model('News', NewsSchema, 'news');
