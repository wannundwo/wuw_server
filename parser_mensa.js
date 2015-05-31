'use strict';

var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var async = require('async');
var crypto = require('crypto');
var path = require('path');

// how many weeks should we parse?
var weeksToParse = 3;

// mongodb
var mongohost='localhost:27017';
var mongodb=process.env.WUWDB || 'wuw';
var mongoConnection='mongodb://' + mongohost + '/' + mongodb;

// running as module or standalone?
var standalone = !module.parent;
var scriptName = path.basename(module.filename, path.extname(module.filename));

// parsing
var parse = function(html, cb) {
    // create models from our schemas
    var Dish = require('./models/model_dish');

    // init cheerio with our html
    var $ = cheerio.load(html);
    var fullWeek = $('div.print-content div.view div.view-content div.item-list ul').children();

    // parse each week of food
    async.each(fullWeek, function(dayPlan, daycb) {

        var curDate = $(dayPlan).find('span.date-day-numeric').html().trim();
        var curDateArr = curDate.split('.');
        var intDate = curDateArr[1] + '/' + curDateArr[0] + '/' + curDateArr[2];

        var i = 0;
        async.each($(dayPlan).find('td.speiseangebotbody'), function(e, dishcb) {

            // split main dishes from the side dishes & sweets
            if(i !== 6 && i !== 7) {

                // create dish from our Model
                var curDish = new Dish();
                curDish.dishName = $(e).find('span.name').text();
                curDish.shortCat = i;
                curDish.date = Date.parse(intDate);

                var additiveNumber = $(e).find('span.additive_number');

                // get the price
                var prices = $(e).first().contents().filter(function() {
                    return this.type === 'text';
                }).text().trim().split(' / ');

                // if prices exists, split to internal and external
                if(prices.length === 2) {
                    curDish.priceInternal = prices[0].replace(',', '.');
                    curDish.priceExternal = prices[1].replace(',', '.');
                }

                // prepare attributes, allergens & additives
                if(additiveNumber) {
                    $(additiveNumber).each(function(i, e) {
                        // split to single strings/numbers
                        var adds = $(e).html().split(',');
                        // allergens
                        if(i === 0) {
                            adds.forEach(function(add) {
                                curDish.shortAllerg.push(add);
                            });
                        // additives
                        } else if(i === 1) {
                            adds.forEach(function(add) {
                                curDish.shortAdd.push(add);
                            });
                        }
                    });
                }

                // save to database
                curDish.save(dishcb);

            // side dishes & sweets
            // } else if (i === 6 || i === 7) {
            //     console.log($(e));
            } else {
                dishcb();
            }

            i++;
        }, function(){
            // day done
            daycb();
        });

    }, function() {
        // week done
        cb();
    });
};

// get the calendar week
Object.defineProperty(Date.prototype, 'getWeek', {
    value: function() {
        var determinedate = new Date();
        determinedate.setFullYear(this.getFullYear(), this.getMonth(), this.getDate());
        var D = determinedate.getDay();
        if(D === 0) { D = 7; }
        determinedate.setDate(determinedate.getDate() + (4 - D));
        var YN = determinedate.getFullYear();
        var ZBDoCY = Math.floor((determinedate.getTime() - new Date(YN, 0, 1, -6)) / 86400000);
        var WN = 1 + Math.floor(ZBDoCY / 7);
        return WN;
    }
});

// create urls including the calendar week which we want to parse
var createUrls = function() {
    var urls = [];
    for(var i = 0; i < weeksToParse; i++) {
        // get date to parse
        var today = new Date();
        var currentWeek = (today.getWeek() + i) % 53;
        var currentYear = today.getFullYear();
        // assemble datestring & url
        var currWeek = currentYear + '-W' + currentWeek;
        var url = 'https://www.studierendenwerk-stuttgart.de/print/gastronomie/speiseangebot/' + currWeek;
        urls.push(url);
    }
    return urls;
};

var startParser = function() {
    // connect to mongodb (if not already)
    if(mongoose.connection.readyState === 0) {
        mongoose.connect(mongoConnection);
    }

    // create model from our schema (needed for drop)
    var Dish = require('./models/model_dish');

    // create the urls to parse
    var urls = createUrls();

    console.log('[' + (new Date()) + '] ' + scriptName + ': started with { weeksToParse: ' + weeksToParse + ' }');
    // simple progress display if run as standalone
    if (standalone) { process.stdout.write(' '); }

    // drop current collection to get a fresh result
    mongoose.connection.collections.dishes.drop(function(err) {
        if(err) { console.log(err); }

        // parse every url (max. 5 parallel, dont fuck the studentenwerk)
        async.eachLimit(urls, 5, function(url, cb) {
            request(url, function(error, response, html) {
                if(!error) {
                    // parse html with all dishes for choosen date
                    parse(html, function() {
                        // simple progress display if run as standalone
                        if (standalone) { process.stdout.write(' *'); }
                        cb();
                    });
                }
            });
        }, function() {
            // disconnect mongodb if run as standalone
            if (standalone) {
                process.stdout.write('\n');
                mongoose.disconnect();
            }

            console.log('[' + (new Date()) + '] ' + scriptName + ': completed successfully');
        });
    });
};

// immediately start parsing if run as standalone
if (standalone) { startParser(); }

module.exports = { startParser: startParser, parse: parse };
