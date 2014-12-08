// Source: https://www.npmjs.org/package/sanitize-html
var sanitizeHtml = require('sanitize-html');

var utils = {};

/*
  Send a 200 OK with success:true in the request body to the
  response argument provided.
  The caller of this function should return after calling
*/
utils.sendSuccessResponse = function(res, content) {
  res.status(200).json({
    success: true,
    content: content
  }).end();
};

/*
  Send an error code with success:false and error message
  as provided in the arguments to the response argument provided.
  The caller of this function should return after calling
*/
utils.sendErrResponse = function(res, errcode, err) {
  res.status(errcode).json({
    success: false,
    err: err
  }).end();
};


/**
* Checks whether a string matches regex for a valid email, and returns a boolean.
*
* Source: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
*/
utils.validateEmail = function(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

/** 
* Author: ulloac@mit.edu
*/
utils.sanitizeInput = function(user_input) {
    var input = user_input;
    if (typeof input === "object") {
        input = JSON.stringify(input);
    }
    input = sanitizeHtml(input);
    return input;
}


module.exports = utils; 