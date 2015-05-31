'use strict';

var Please = require('pleasejs');
var crypto = require('crypto');


// simple hash-algo to generate 12 byte long objectId
var hashCode = function(s){
    var hash = crypto.createHash('md5').update(s).digest('hex').substring(0, 12);
    return hash;
};


// generate color from string
var stringToColor = function(str) {

    if (typeof str === 'undefined') {
        return '#444444';
    }

    var color = Please.make_color({
        saturation: 0.6,
        seed: str,
    })[0];
    return color;
};

module.exports = { hashCode: hashCode, stringToColor: stringToColor };
