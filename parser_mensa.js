"use strict";

var request = require("request");
var cheerio = require("cheerio");
var mongoose = require("mongoose");
var async = require("async");
var crypto = require("crypto");


// how many weeks should we parse?
var weeksToParse = 1;

// mensa constants, should be outsourced to mongo virtuals
var mensaCategories = ["Vorspeise", "Das Komplettpaket", "Die solide Basis", "Bio pur", "Das grüne Glück", "Der Renner", "Beilagen", "Nachtisch"];
var mensaAdditives = ["mit Konservierungsstoff", "mit Farbstoff", "mit Antioxidationsmittel", "mit Geschmacksverstärker", "geschwefelt", "gewachst", "mit Phosphat", "mit Süßungsmittel", "enthält eine Phenylalaninquelle", "geschwärzt"];
var mensaAllergens = { "En": "Erdnuss", "Fi": "Fisch", "Gl": "Glutenhaltiges Getreide", "Ei": "Eier", "Kr": "Krebstiere (Krusten- und Schalentiere)", "Lu": "Lupine", "La": "Milch und Laktose", "Nu": "Schalenfrüchte (Nüsse)", "Sw": "Schwefeldioxid (SO2) und Sulfite", "Sl": "Sellerie", "Sf": "Senf", "Se": "Sesam", "So": "Soja", "Wt": "Weichtiere"};


// mongodb
var mongohost="localhost:27017";
var mongodb=process.env.WUWDB || "wuw";
var mongoConnection="mongodb://" + mongohost + "/" + mongodb;
// connect
mongoose.connect(mongoConnection);


// simple hash-algo to generate 12 byte long objectId
var hashCode = function(s){
    var hash = crypto.createHash('md5').update(s).digest('hex').substring(0, 12);
    return hash;
};

// parsing
var parse = function(html, cb) {
    // create models from our schemas
    var Dish = require("./models/model_dish");

    // init cheerio with our html
    var $ = cheerio.load(html);
    var fullWeek = $("div.print-content div.view div.view-content div.item-list ul").children();

    // parse each week of food
    async.each(fullWeek, function(dayPlan, daycb) {

        var curDate = $(dayPlan).find("span.date-day-numeric").html().trim();
        var curDateArr = curDate.split(".");
        var intDate = curDateArr[1] + "/" + curDateArr[0] + "/" + curDateArr[2];

        var i = 0;
        async.each($(dayPlan).find("td.speiseangebotbody"), function(e, dishcb) {

            // split main dishes from the side dishes & sweets
            if(i !== 6 && i !== 7) {

                // create dish from our Model
                var curDish = new Dish();
                curDish.dishName = $(e).find("span.name").text();
                curDish.category = mensaCategories[i];
                curDish.date = Date.parse(intDate);

                var additiveNumber = $(e).find("span.additive_number");

                // prepare attributes, allergens & additives
                if(additiveNumber) {
                    $(additiveNumber).each(function(i, e) {
                        // split to single strings/numbers
                        var adds = $(e).html().split(",");
                        // allergens
                        if(i === 0) {
                            adds.forEach(function(add) {
                                //curDish.allergens.push(add);
                                curDish.allergens.push(mensaAllergens[add]);
                            });
                        // additives
                        } else if(i === 1) {
                            adds.forEach(function(add) {
                                //curDish.additives.push(add);
                                curDish.additives.push(mensaAdditives[(parseInt(add)-1)]);
                            });
                        }
                    });
                }

                // save to database
                curDish.save(dishcb);
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
Object.defineProperty(Date.prototype, "getWeek", {
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
        var currWeek = currentYear + "-W" + currentWeek;
        var url = "https://www.studierendenwerk-stuttgart.de/print/gastronomie/speiseangebot/" + currWeek;
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
    var Dish = require("./models/model_dish");

    // create the urls to parse
    var urls = createUrls();

    console.log("started parsing of " + weeksToParse + " weeks (this inlcuded)...");

    // drop current collection to get a fresh result
    mongoose.connection.collections.dishes.drop(function(err) {
        if(err) { console.log(err); }

        console.log("dropped old \""+ Dish.collection.name + "\" collection, lets start clean...");

        // parse every url (max. 5 parallel, dont fuck the studentenwerk)
        async.eachLimit(urls, 5, function(url, cb) {
            request(url, function(error, response, html) {
                if(!error) {
                    // parse html with all dishes for choosen date
                    parse(html, cb);
                }
            });
        }, function() {
            // everything done
            mongoose.disconnect();
            console.log("...done!");
        });
    });
};

// start the magic
startParser();

module.exports = { startParser: startParser, parse: parse };
