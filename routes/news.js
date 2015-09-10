'use strict';

// import the express router
var router = require('express').Router();

// create model
var News = require('../models/model_news');


// route /news
router.route('/')

    // GET
    .get(function(req, res) {

        // db query
        News.find().sort({created: -1}).limit(60).exec(function(err, news) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(news);
            res.end();
        });
    });


// route /news/:news_id
router.route('/:news_id')

    // get item by id
    .get(function(req, res) {
        News.findById(req.params.news_id, function(err, news) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(news);
            res.end();
        });
    });


module.exports = router;
