'use strict';

var router = require('express').Router();
var News = require('../models/model_news');

// on routes that end in /news
router.route('/')

    /*
     * Returns all news.
     */
    .get(function(req, res) {
        News.find().sort({created: -1}).limit(60).exec(function(err, news) {
            if (err) { res.status(500).send(err); }
            res.status(200).json(news);
            res.end();
        });
    });

module.exports = router;
