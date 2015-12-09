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
var url = 'http://php.rz.hft-stuttgart.de/hftapp/veranstaltungenhftapp.php';

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
    if (mongoose.connection.readyState === 0) {
        mongoose.connect(mongoConnection);
    }

    // create model from our schema (needed for drop)
    var Event = require('./models/model_event');

    console.log('[' + (new Date()) + '] ' + scriptName + ': started with { }');

    // simple progress display if run as standalone
    if (standalone) { process.stdout.write(' '); }

    // fetch xml
    request(url, function(err, response, xml) {
        if (err) { console.log(err); }
        else {

            // parse xml
            parseString(xml, { explicitArray: false, normalize: true }, function (err, result) {
                if (err) { console.log(err); }
                else {

                    // drop current collection to get a fresh result
                    mongoose.connection.collections.events.drop(function(err) {
                        if(err) { console.log(err); }

                        // process each element
                        async.eachLimit(result.Veranstaltungen.Veranstaltung, 10, function(ev, cb) {

                            // create an object from our model
                            var eventObj = new Event();
                            // set attributes
                            eventObj.title = ev.Titel;
                            eventObj.contact = ev.Kontakt;
                            eventObj.location = ev.Location;
                            eventObj.startTime = new Date(ev.start.slice(0, -6));
                            eventObj.endTime = new Date(ev.ende.slice(0, -6));

                            // if start and endtime are equal, remove the endtime
                            if (eventObj.startTime.getTime() === eventObj.endTime.getTime()) {
                                eventObj.endTime = null;
                            }

                            // starttime 01:00 means "don't set any starttime at all"
                            if (eventObj.startTime.getHours() === 1) {
                                eventObj.startTime = null;
                            }

                            eventObj.created = new Date(ev.created);
                            eventObj.modified = new Date(ev.modified);
                            // filter 'null' values from attributes
                            if (ev.Description !== 'None') {
                                eventObj.descr = ev.Description;
                            }

                            // add base-url if not present
                            if(ev.Event_Url !== '') {
                                eventObj.url = (ev.Event_Url.substring(0, 4) === "http") ? ev.Event_Url : 'http://www.hft-stuttgart.de' + ev.Event_Url;
                            }

                            // this is just inserting, not upserting!
                            Event.update({ title: eventObj.title }, { $set: eventObj.toObject()  }, { upsert: true }, function() {
                                // simple progress display if run as standalone
                                if (standalone) { process.stdout.write(' *'); }
                                cb();
                            });

                        }, function() {
                            // when everything is done, clean up
                            if (standalone) {
                                process.stdout.write('\n');
                                mongoose.disconnect();
                            }
                            console.log('[' + (new Date()) + '] ' + scriptName + ': completed successfully');
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
