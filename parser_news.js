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
var url = 'http://localhost:8000/news.xml';

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
    var News = require('./models/model_news');

    console.log('[' + (new Date()) + '] ' + scriptName + ': started with { }');

    // simple progress display if run as standalone
    if (standalone) { process.stdout.write(' '); }

    // fetch xml
    request(url, function(err, response, xml) {
        if(err) { console.log(err); }
        else {

            // parse xml
            parseString(xml, { explicitArray: false, normalize: true, preserveChildrenOrder: true }, function (err, result) {
                if(err) { console.log(err); }
                else {

                    // drop current collection to get a fresh result
                    mongoose.connection.collections.news.drop(function(err) {
                        if(err) { console.log(err); }

                        // process each element
                        async.eachLimit(result.nachrichten.nachricht, 5, function(newsEntry, cb) {

                            // create an object from our model
                            var newsObj = new News();
                            // set attributes
                            newsObj.title = newsEntry.titel;
                            newsObj.url = newsEntry.url;
                            newsObj.descr = newsEntry.description;
                            newsObj.created = new Date(newsEntry.created);
                            newsObj.modified = new Date(newsEntry.modified);

                            // get our html back from our json-xml-object - crazy but working
                            var builder = new xml2js.Builder({ headless: true, renderOpts: { pretty: false } });
                            // we need a html tag because this is all crazy and wont work without, so we use 'section'
                            var newsText = { section: newsEntry.text };
                            var newsTextHTML = builder.buildObject(newsText);
                            newsObj.text = newsTextHTML;

                            // this is just inserting, not upserting!
                            News.update({ title: newsObj.title }, { $set: newsObj.toObject()  }, { upsert: true }, function() {
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
