// wuw server
'use strict';

// core
var fs = require('fs');
var https = require('https');
var util = require('util');
// npm
var bodyParser = require('body-parser');
var bunyan = require('bunyan');
var express = require('express');
var expressValidator = require('express-validator');
var fileStreamRotator = require('file-stream-rotator');
var mongoose = require('mongoose');
var morgan = require('morgan');
var schedule = require('node-schedule');


// logging
var logDir = '/var/log/wuw-hft';
var log, morganFormat, morganLogStream;

if(process.env.NODE_ENV === 'dev') {
    log = bunyan.createLogger({name: "wuw-hft-dev", level: 'info', stream: process.stdout});

    morganFormat = 'dev';
    morganLogStream = process.stdout;
} else {
    // check if logDir is accessable
    fs.accessSync(logDir);

    log = bunyan.createLogger({name: "wuw-hft", streams: [
        {level: 'info', stream: process.stdout},
        {level: 'info', type: 'rotating-file', path: logDir + '/wuw-hft.log', period: '1d', count: 30}
    ]});

    morganFormat = 'combined';
    morganLogStream = fileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: logDir + '/access-%DATE%.log',
        frequency: 'daily',
        verbose: false
    });
}

// import parser modules
var parser = {
    lsf: require('./parser_xml'),
    mensa: require('./parser_mensa'),
    news: require('./parser_news'),
    events: require('./parser_events')
};


// api version & url
var apiVersion = 0;
var apiBaseUrl = '/api/v' + apiVersion;

// write pid
fs.writeFile("/tmp/wuw-api.pid", process.pid);

// ssl
try {
    var use_ssl = true;
    var key = fs.readFileSync('./ssl.key');
    var cert = fs.readFileSync('./ssl.crt');
    var dhparam = fs.readFileSync('./dh_2048.pem');
    // load passphrase from file
    var pass = require('./ssl-pass');
    var https_options = {
        key: key,
        cert: cert,
        passphrase: pass.passphrase,
        dhparam: dhparam,
        ciphers: [
            'ECDHE-RSA-AES256-SHA384',
            'DHE-RSA-AES256-SHA384',
            'ECDHE-RSA-AES256-SHA256',
            'DHE-RSA-AES256-SHA256',
            'ECDHE-RSA-AES128-SHA256',
            'DHE-RSA-AES128-SHA256',
            'HIGH',
            '!aNULL',
            '!eNULL',
            '!EXPORT',
            '!DES',
            '!RC4',
            '!MD5',
            '!PSK',
            '!SRP',
            '!CAMELLIA'
        ].join(':'),
        honorCipherOrder: true
    };
} catch(err) {
    if (err) { use_ssl = false; }
}


// mongodb
var mongohost='localhost:27017';
var mongodb=process.env.WUWDB || 'wuw';
var mongoConnection='mongodb://' + mongohost + '/' + mongodb;
// connect
if(mongoose.connection.readyState === 0) {
    mongoose.connect(mongoConnection);
}

// create models from our schemas
var Lecture = require('./models/model_lecture');
var Deadline = require('./models/model_deadline');

// create the express app, router & configure port
var app = express();
var router = express.Router();
var apiPort = process.env.WUWPORT || 4342;

// use morgan to log
app.use(morgan(morganFormat, {stream: morganLogStream}));

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());

// allow cross origin resource sharing
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// middleware to use for all requests
//router.use(function(req, res, next) {  next(); });

// api home route (GET /$apiBaseUrl)
router.get('/', function(req, res) {
    res.status(200).json({ message: 'welcome to the wuw api v' + apiVersion });
    res.end();
});

// register our routes & routers
router.use('/news', require('./routes/news'));
router.use('/events', require('./routes/events'));
router.use('/lectures', require('./routes/lectures'));
router.use('/deadlines', require('./routes/deadlines'));
router.use('/rooms', require('./routes/rooms'));
router.use('/groups', require('./routes/groups'));
router.use('/dishes', require('./routes/dishes'));
router.use('/users', require('./routes/users'));
router.use('/printers', require('./routes/printers'));
// register base & default router
app.use(apiBaseUrl, router);


// catch-all route to handle 404 errors
app.get('*', function(req, res, next) {
    var err = new Error();
    err.status = 404;
    err.message = "404 Not Found";
    next(err);
});

// handle error
app.use(function(err, req, res, next) {
    if(process.env.NODE_ENV !== 'test') {
        console.error({
            status: err.status,
            message: err.message,
            stack: err.stack.split('\n')
        });
    }
    res.status(err.status || 500).send({ error: err.message });
});


// schedule parser jobs
var jobs = [
    // parser_lsf
    schedule.scheduleJob('45 * * * *', function(){
        parser.lsf.startParser();
    }),
    // parser_mensa
    schedule.scheduleJob('35 4 * * *', function(){
        parser.mensa.startParser();
    }),
    // parser_news
    schedule.scheduleJob('25 * * * *', function(){
        parser.news.startParser();
    }),
    // parser_events
    schedule.scheduleJob('15 * * * *', function(){
        parser.events.startParser();
    })
];


// start the server
var serverInfo = {ssl: use_ssl, mongodb: mongoConnection, apiPort: apiPort};
if (use_ssl) {
    var server = https.createServer(https_options, app).listen(apiPort);
} else {
    var server = app.listen(apiPort);
}
log.info(serverInfo, 'started successfully');


// starter & stopper functions for testing
var startApi = function() {
    if (!server) { server = app.listen(apiPort); }
};
var stopApi = function() {
    server.close();
};


// export functions
module.exports = { startApi: startApi, stopApi: stopApi };
