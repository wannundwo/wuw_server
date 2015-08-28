'use strict';

var request = require('request');
var mongoose = require('mongoose');
var async = require('async');
var crypto = require('crypto');
var parseString = require('xml2js').parseString;
var utils = require('./wuw_utils');
var path = require('path');

// data source
//var url = 'http://php.rz.hft-stuttgart.de/hftapp/raumbelegunghftapp.php';
var url = 'http://localhost:8000/events.xml';

// mongodb
var mongohost='localhost:27017';
var mongodb=process.env.WUWDB || 'wuw';
var mongoConnection='mongodb://' + mongohost + '/' + mongodb;

// running as module or standalone?
var standalone = !module.parent;
var scriptName = path.basename(module.filename, path.extname(module.filename));

var startParser = function() {
    // connect to mongodb (if not already)
    if(mongoose.connection.readyState === 0) {
        mongoose.connect(mongoConnection);
    }

    // create model from our schema (needed for drop)
    var Event = require('./models/model_event');

    console.log('[' + (new Date()) + '] ' + scriptName + ': started with { }');

    // simple progress display if run as standalone
    if (standalone) { process.stdout.write(' '); }

    // drop current collection to get a fresh result
    mongoose.connection.collections.events.drop(function(err) {
        if(err) { console.log(err); }

        // fetch xml
        request(url, function(err, response, xml) {
            if(err) { console.log(err); }
            else {

                // parse xml
                parseString(xml, {explicitArray: false}, function (err, result) {
                    if(err) { console.log(err); }
                    else {

                        // process each event
                        async.eachLimit(result.Veranstaltungen.Veranstaltung, 5, function(ev, cb) {

                            // create an event object from our model
                            var eventObj = new Event();
                            // set attributes
                            eventObj.title = ev.Titel;
                            eventObj.contact = ev.Kontakt;
                            eventObj.location = ev.Location;
                            eventObj.startTime = new Date(ev.start.slice(0, -6));
                            eventObj.endTime = new Date(ev.ende.slice(0, -6));
                            eventObj.created = new Date(ev.created);
                            eventObj.modified = new Date(ev.modified);
                            // filter 'null' values from attributes
                            if(ev.Description !== 'None') { eventObj.descr = ev.Description; }
                            if(ev.Event_Url !== '') { eventObj.url = ev.Event_Url; }

                            // do we need upserting for events? or clean the hole collection every time?
                            Event.update({ _id: eventObj.id }, { $set: eventObj.toObject()  }, { upsert: true }, function() {
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
                    }
                });
            }
        });
    });
};

// immediately start parsing if run as standalone
if (standalone) { startParser(); }

module.exports = { startParser: startParser };
