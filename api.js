// wuw server
"use strict";

// import packages (api)
var express = require("express");
var expressValidator = require("express-validator");
var bodyParser = require("body-parser");
var util = require("util");
var mongoose = require("mongoose");
var morgan = require("morgan");
var https = require("https");
var fs = require("fs");


// api version & url
var apiVersion = 0;
var apiBaseUrl = "/api/v" + apiVersion;


// ssl
try {
    var use_ssl = true;
    var key = fs.readFileSync("./ssl-wuw.key");
    var cert = fs.readFileSync("./ssl-wuw.crt");
    // load passphrase from file
    var pass = require("./ssl-pass");
    var https_options = {
        key: key,
        cert: cert,
        passphrase: pass.passphrase
    };
} catch(err) {
    if (err) { use_ssl = false; }
}


// mongodb
var mongohost="localhost:27017";
var mongodb=process.env.WUWDB || "wuw";
var mongoConnection="mongodb://" + mongohost + "/" + mongodb;
// connect
mongoose.connect(mongoConnection);

// create models from our schemas
var Lecture = require("./models/model_lecture");
var Deadline = require("./models/model_deadline");

// create the express app, router & configure port
var app = express();
var router = express.Router();
var apiPort = process.env.WUWPORT || 4342;

// use morgan to log
app.use(morgan("dev"));

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());

// allow cross origin resource sharing
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// middleware to use for all requests
router.use(function(req, res, next) {  next(); });

// api home route (GET /$apiBaseUrl)
router.get("/", function(req, res) {
    res.status(200).json({ message: "welcome to the wuw api v" + apiVersion });
    res.end();
});

// register our routes & routers
router.use("/lectures", require("./routes/lectures"));
router.use("/deadlines", require("./routes/deadlines"));
router.use("/rooms", require("./routes/rooms"));
router.use("/groups", require("./routes/groups"));
router.use("/dishes", require("./routes/dishes"));
router.use("/users", require("./routes/users"));
// register base & default router
app.use(apiBaseUrl, router);


// catch-all route to handle 404 errors
app.get('*', function(req, res, next) {
    var err = new Error();
    err.status = 404;
    next(err);
});

// handle 404 error
app.use(function(err, req, res, next) {
    // if its not a 404, pass to next handler
    if(err.status !== 404) { return next(err); }
    // send 404
    res.status(404).send({ msg: 'whoopsie!' });
});

// handle other errors
app.use(function(err, req, res, next) {
    console.error(err);
    res.status(500).send({ msg: 'big whoopsie!' });
});


// start the server
console.log("\n* starting the wuw api\n");
console.log("  mongodb:  " + mongoConnection);
console.log("  ssl:      " + use_ssl);
if (use_ssl) {
    var server = https.createServer(https_options, app).listen(apiPort);
    console.log("  url:      https://localhost:" + apiPort + apiBaseUrl);
} else {
    var server = app.listen(apiPort);
    console.log("  url:      http://localhost:" + apiPort + apiBaseUrl);
}
console.log();


// starter & stopper functions for testing
var startApi = function() {
    if (!server) { server = app.listen(apiPort); }
};
var stopApi = function() {
    server.close();
};


// export functions
module.exports = { startApi: startApi, stopApi: stopApi };
