"use strict";

var assert = require('assert');
var fs = require('fs');
var request = require('request');
var api = require('../api');
var parser = require('../parser_lsf');


// urls
var apiBaseUrl = "http://localhost:4342/api/v0/";
var lecturesBaseUrl = apiBaseUrl + "lectures";
var deadlinesBaseUrl = apiBaseUrl + "deadlines";
var groupsBaseUrl = apiBaseUrl + "groups";
var dishesBaseUrl = apiBaseUrl + "dishes";
var roomsBaseUrl = apiBaseUrl + "rooms";


describe('API', function(){

    before(function () {
        api.startApi();
    });

    after(function () {
        api.stopApi();
    });

    it('/ should return 200 & welcome message', function(done) {
        request(apiBaseUrl, function(error, response, json) {
            assert.equal(response.statusCode, 200);
            assert.equal(json, '{"message":"welcome to the wuw api v0"}');
            done();
        });
    });


    describe('routes', function() {
        describe('lectures', function() {

            it('/lectures should return 200', function(done) {
                request(lecturesBaseUrl, function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
            it('/lectures/upcoming should return 200', function(done) {
                request(lecturesBaseUrl + "/upcoming", function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
            it('/lectures/groups should return 200', function(done) {
                request.post(lecturesBaseUrl + "/groups", {groups:"IF3_4"}, function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
            it('/lectures/weekly should return 200', function(done) {
                request.post(lecturesBaseUrl + "/weekly", {groups:"IF3_4"}, function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
            it('/lectures/:lecture_id should return 500', function(done) {
                request(lecturesBaseUrl + "/133731337", function(error, response, html) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });


        describe('deadlines', function() {

            it('/deadlines should return 200', function(done) {
                request(deadlinesBaseUrl, function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
            it('/deadlines/:deadline_id should return 500', function(done) {
                request(deadlinesBaseUrl + "/133731337", function(error, response, html) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });


        describe('groups', function() {

            it('/dishes should return 200', function(done) {
                request(groupsBaseUrl, function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
            it('/groups/lectures should return 200', function(done) {
                request(groupsBaseUrl + "/lectures", function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });


        describe('dishes', function() {

            it('/dishes should return 200', function(done) {
                request(dishesBaseUrl, function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
            it('/dishes/:dish_id should return 500', function(done) {
                request(dishesBaseUrl + "/133731337", function(error, response, html) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });


        describe('rooms', function() {

            it('/rooms should return 200', function(done) {
                request(roomsBaseUrl, function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
            it('/rooms/free should return 200', function(done) {
                request(roomsBaseUrl + "/free", function(error, response, html) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
    });

    describe('deadlines', function() {

        var id = "";

        it('it should create deadline', function(done) {
            var deadline = {
                info: 'Do it!',
                deadline: new Date()
            };

            var conf = {
                url: deadlinesBaseUrl,
                form: deadline
            };

            // create a deadline
            request.post(conf, function(error, response, body) {
                assert.equal(response.statusCode, 200);
                id = JSON.parse(body).id;
                assert.notEqual(typeof id, 'undefined');
                done();
            });
        });
        it('it should have the previously created deadline', function(done) {
            var url = deadlinesBaseUrl + '/' + id;
            request(url, function(error, response, html) {
                assert.equal(response.statusCode, 200);
                var info = JSON.parse(html).info;
                assert.equal(info, 'Do it!');
                done();
            });
        });
    });
});
