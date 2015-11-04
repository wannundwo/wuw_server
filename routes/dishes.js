'use strict';

var router = require('express').Router();
var Dish = require('../models/model_dish');

// on routes that end in /dishes
router.route('/')

    /*
     * Returns all dishes since today 00:00 o'clock.
     */
    .get(function(req, res, next) {

        // today at 0:00
        var today = new Date();
        today.setHours(0,0,0,0);

        // get all upcoming (incl current day) entries
        Dish.find({'date': {'$gte': today}}).sort({date: 1, priceInternal: 1}).limit(60).exec(function(err, dishes) {
            if (err) { next(err); return; }
            res.status(200).json(dishes);
            res.end();
        });
    });

module.exports = router;
