"use strict";

var mongoose = require("mongoose");
var utils = require("../utils");

// mensa constants, should be outsourced to mongo virtuals
var mensaCategories = ["Vorspeise", "Das Komplettpaket", "Die solide Basis", "Bio pur", "Das grüne Glück", "Der Renner", "Beilagen", "Nachtisch"];
var mensaAdditives = ["mit Konservierungsstoff", "mit Farbstoff", "mit Antioxidationsmittel", "mit Geschmacksverstärker", "geschwefelt", "gewachst", "mit Phosphat", "mit Süßungsmittel", "enthält eine Phenylalaninquelle", "geschwärzt"];
var mensaAllergens = { "En": "Erdnuss", "Fi": "Fisch", "Gl": "Glutenhaltiges Getreide", "Ei": "Eier", "Kr": "Krebstiere (Krusten- und Schalentiere)", "Lu": "Lupine", "La": "Milch und Laktose", "Nu": "Schalenfrüchte (Nüsse)", "Sw": "Schwefeldioxid (SO2) und Sulfite", "Sl": "Sellerie", "Sf": "Senf", "Se": "Sesam", "So": "Soja", "Wt": "Weichtiere"};


// create mongodb schema for our lectures
var DishSchema = new mongoose.Schema({
    dishName: String,
    date: Date,
    priceInternal: Number,
    priceExternal: Number,
    attributes: [String],
    shortCat: Number,
    shortAdd: [Number],
    shortAllerg: [String]
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

DishSchema.virtual("category").get(function () {
    return mensaCategories[this.shortCat];
});

DishSchema.virtual("additives").get(function () {
    var adds = [];
    this.shortAdd.forEach(function(a) {
        adds.push(mensaAdditives[a]);
    });
    return adds;
});

DishSchema.virtual("allergens").get(function () {
    var allergs = [];
    this.shortAllerg.forEach(function(a) {
        allergs.push(mensaAllergens[a]);
    });
    return allergs;
});

DishSchema.virtual("color").get(function () {
    return utils.stringToColor(this.category);
});

// create model from our schema & export it
module.exports = mongoose.model("Dish", DishSchema, "dishes");
