'use strict';

var request = require('request');
var mongoose = require('mongoose');
var async = require('async');
var crypto = require('crypto');
var parseString = require('xml2js').parseString;
var utils = require('./utils');


// data source
//var url = 'http://php.rz.hft-stuttgart.de/hftapp/raumbelegunghftapp.php';
var url = 'http://localhost:8000/hft.xml';


// mongodb
var mongohost='localhost:27017';
var mongodb=process.env.WUWDB || 'wuw';
var mongoConnection='mongodb://' + mongohost + '/' + mongodb;
// connect
mongoose.connect(mongoConnection);

var startParser = function() {
    // connect to mongodb (if not already)
    if(mongoose.connection.readyState === 0) {
        mongoose.connect(mongoConnection);
    }

    // create model from our schema (needed for drop)
    var Lecture = require('./models/model_lecture');

    console.log('\n * lsf parser started\n');

    // drop current lecture collection to get a fresh result
    mongoose.connection.collections.lectures.drop(function(err) {
        if(err) { console.log(err); }

        console.log('  * dropped old \''+ Lecture.collection.name + '\' collection...');

        request(url, function(err, response, xml) {
            if(err) { console.log(err); }
            else {
                console.log('  * got XML data');

                // parse xml
                parseString(xml, function (err, result) {
                    if(err) { console.log(err); }
                    else {
                        console.log('  * parsed data to json');
                        console.log('  * starting import');

                        async.eachLimit(result.Raumbelegungen.dbrow, 5, function(lecture, cb) {

                            // create Lecture from our Model
                            var Lec = new Lecture();
                            // set attributes
                            Lec.lectureName = lecture.title;
                            Lec.startTime = new Date(lecture.start);
                            Lec.endTime = new Date(lecture.ende);
                            Lec.docents = lecture.personname;
                            Lec.hashCode = utils.hashCode(Lec.lectureName+Lec.startTime);
                            Lec._id = mongoose.Types.ObjectId(Lec.hashCode);

                            //console.log(Lec);

                            // create an object from our document
                            var upsertData = Lec.toObject();
                            // delete attributes to upsert
                            delete upsertData.rooms;
                            delete upsertData.groups;

                            var room = lecture.raum[0];
                            var group = lecture.semesterverband[0];

                            console.log(lecture.raum + ' -> ' + room);
                            console.log(lecture.semesterverband + ' -> ' + group);
                            console.log();

                            //Lecture.update({ _id: Lec.id }, { $set: upsertData, $addToSet: { rooms: room, groups: group }  }, { upsert: true }, cb);

                            // lectures without a group/room are useless...
                            if(group !== '' && room !== '') {
                                // save lecture to db & call callback
                                Lecture.update({ _id: Lec.id }, { $set: upsertData, $addToSet: { rooms: room, groups: group }  }, { upsert: true }, cb);
                            } else {
                                cb();
                            }
                        });
                    }
                });
            }
        });
    });
};

// start the magic
startParser();

//module.exports = { startParser: startParser, parse: parse };
