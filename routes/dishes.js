'use strict';

// import the express router
var router = require('express').Router();

// create model
var Dish = require('../models/model_dish');


// route /dishes
router.route('/')

    // GET
    .get(function(req, res) {

        // today at 0:00
        var today = new Date();
        today.setHours(0,0,0,0);

        // get all upcoming (incl current day) entries
        Dish.find({'date': {'$gte': today}}).sort({date: 1, priceInternal: 1}).limit(60).exec(function(err, dishes) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(dishes);
            res.end();
        });
    });


// route /dishes/:dish_id
router.route('/:dish_id')

    // get item by id
    .get(function(req, res) {
        Dish.findById(req.params.dish_id, function(err, dish) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(dish);
            res.end();
        });
    });


module.exports = router;
