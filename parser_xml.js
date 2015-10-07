'use strict';

// core
var crypto = require('crypto');
var path = require('path');
// npm
var async = require('async');
var mongoose = require('mongoose');
var request = require('request');
var xml2js = require('xml2js');
var parseString = xml2js.parseString;
// wuw
var utils = require('./wuw_utils');


// data source
var url = 'http://php.rz.hft-stuttgart.de/hftapp/raumbelegunghftapp.php';

// mongodb
var mongohost='localhost:27017';
var mongodb=process.env.WUWDB || 'wuw';
var mongoConnection='mongodb://' + mongohost + '/' + mongodb;

// running as module or standalone?
var standalone = !module.parent;
var scriptName = path.basename(module.filename, path.extname(module.filename));

// main function
var startParser = function() {
    // connect to mongodb (if not already)
    if(mongoose.connection.readyState === 0) {
        mongoose.connect(mongoConnection);
    }

    // create model from our schema (needed for drop)
    var Lecture = require('./models/model_lecture');

    console.log('[' + (new Date()) + '] ' + scriptName + ': started with { }');

    // simple progress display if run as standalone
    if (standalone) { process.stdout.write(' '); }

    // fetch xml
    request(url, function(err, response, xml) {
        if(err) { console.log(err); }
        else {

            // parse xml
            parseString(xml, function (err, result) {
                if(err) { console.log(err); }
                else {

                    // drop current collection to get a fresh result
                    mongoose.connection.collections.lectures.drop(function(err) {
                        if(err) { console.log(err); }

                        // counter
                        var allElements = 0;
                        var addedElements = 0;

                        // process each element
                        async.eachLimit(result.Raumbelegungen.dbrow, 5, function(lecture, cb) {

                            allElements++;

                            // create Lecture from our Model
                            var Lec = new Lecture();
                            // set attributes
                            Lec.lectureName = lecture.title;
                            Lec.startTime = new Date(lecture.start);
                            Lec.endTime = new Date(lecture.ende);
                            Lec.docents = lecture.personname;
                            Lec.hashCode = utils.hashCode(Lec.lectureName+Lec.startTime);
                            Lec._id = mongoose.Types.ObjectId(Lec.hashCode);

                            // create an object from our document
                            var upsertData = Lec.toObject();
                            // delete/set attributes to upsert
                            delete upsertData.rooms;
                            delete upsertData.groups;
                            var room = lecture.bau + '/' + lecture.Raum[0];

                            // add dummy group if needed
                            var group;
                            if(!(group = lecture.semesterverband[0])) {
                                group = '- frei wählbar -'
                            }

                            // lectures without a group/room are useless...
                            if(room !== '') {
                                // save lecture to db & call callback
                                Lecture.update({ _id: Lec.id }, { $set: upsertData, $addToSet: { rooms: room, groups: group }  }, { upsert: true }, function() {
                                    // simple progress display if run as standalone
                                    if (standalone) { process.stdout.write(' *'); }

                                    // incr counter
                                    addedElements++;

                                    // callback
                                    cb();
                                });
                            } else {
                                // callback
                                cb();
                            }

                        }, function() {
                            // when everything is done, clean up
                            if (standalone) {
                                process.stdout.write('\n');
                                mongoose.disconnect();
                            }
                            console.log('[' + (new Date()) + '] ' + scriptName + ': completed successfully! added ' + addedElements + '/' + allElements + ' (' + (allElements - addedElements) + ' missing)');
                        });
                    });
                }
            });
        }
    });
};

// immediately start parsing if run as standalone
if (standalone) { startParser(); }

// export function
module.exports = { startParser: startParser };
