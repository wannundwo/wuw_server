'use strict';

// import the express router
var router = require('express').Router();

// create model
var Dish = require('../models/model_dish');


// on routes that end in /dishes
router.route('/')

    // get upcoming dishes (GET /$apiBaseUrl/dishes)
    .get(function(req, res) {

        // today at 0:00
        var today = new Date();
        today.setHours(0,0,0,0);

        // show all dishes for current day and later
        Dish.find({'date': {'$gte': today}}).sort({date: 1, priceInternal: 1}).limit(60).exec(function(err, dishes) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(dishes);
            res.end();
        });
    });


// on routes that end in /dishes/:dish_id
router.route('/:dish_id')

    // get dish with that id (GET /$apiBaseUrl/dishes/:dish_id)
    .get(function(req, res) {
        Dish.findById(req.params.dish_id, function(err, dish) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(dish);
            res.end();
        });
    });


module.exports = router;
