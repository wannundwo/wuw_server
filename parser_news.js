'use strict';

var request = require('request');
var mongoose = require('mongoose');
var async = require('async');
var crypto = require('crypto');
var xml2js = require('xml2js');
var utils = require('./wuw_utils');

var parseString = xml2js.parseString;

// data source
//var url = 'http://php.rz.hft-stuttgart.de/hftapp/nachrichtenhftapp.php';
var url = 'http://localhost:8000/news.xml';


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
    var News = require('./models/model_news');

    console.log('\n * news parser started\n');

    // drop current lecture collection to get a fresh result
    mongoose.connection.collections.news.drop(function(err) {
        if(err) { console.log(err); }

        console.log('  * dropped old \''+ News.collection.name + '\' collection...');

        request(url, function(err, response, xml) {
            if(err) { console.log(err); }
            else {
                console.log('  * got XML data');

                // parse xml
                parseString(xml, {preserveChildrenOrder: true}, function (err, result) {
                    if(err) { console.log(err); }
                    else {
                        console.log('  * parsed data to json');
                        console.log('  * starting import');
                        console.log();

                        async.eachLimit(result.nachrichten.nachricht, 5, function(newsEntry, cb) {

                            console.log('------------------------------------------------------');
                            //console.log(newsEntry);
                            // create Lecture from our Model
                            var NewsObj = new News();
                            // set attributes
                            NewsObj.lectureName = newsEntry.title;
                            NewsObj.url = newsEntry.url;
                            NewsObj.descr = newsEntry.description;
                            NewsObj.text = newsEntry.text;
                            NewsObj.created = new Date(newsEntry.created);
                            NewsObj.modified = new Date(newsEntry.modified);
                            // NewsObj.hashCode = utils.hashCode(Lec.lectureName+Lec.startTime);
                            // NewsObj._id = mongoose.Types.ObjectId(Lec.hashCode);

                            var builder = new xml2js.Builder({headless: true});
                            var to = builder.buildObject(newsEntry.text[0]);
                            //console.log(newsEntry.text);
                            console.log(newsEntry.text[0]);
                            console.log();
                            console.log();
                            console.log(to);
                            console.log();
                            console.log();
                            console.log('------------------------------------------------------');

                            // // create an object from our document
                            // var upsertData = NewsObj.toObject();
                            // // delete attributes to upsert
                            // delete upsertData.rooms;
                            // delete upsertData.groups;
                            //
                            // var room = newsEntry.raum[0];
                            // var group = newsEntry.semesterverband[0];
                            //
                            // console.log(newsEntry.raum + ' -> ' + room);
                            // console.log(newsEntry.semesterverband + ' -> ' + group);
                            // console.log();

                            // // lectures without a group/room are useless...
                            // if(group !== '' && room !== '') {
                            //     // save lecture to db & call callback
                            //     Lecture.update({ _id: Lec.id }, { $set: upsertData, $addToSet: { rooms: room, groups: group }  }, { upsert: true }, cb);
                            // } else {
                            //     cb();
                            // }
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
