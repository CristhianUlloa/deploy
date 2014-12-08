//author: ulloac@mit.edu

var express = require('express');
var router = express.Router();
var utils = require('../utils/utils');
var User = require('../models/user');

var nodemailer = require("nodemailer");
var mailer = require('../mailer/models');

var path           = require('path')
  , templatesDir   = path.resolve(__dirname, '..', 'templates')
  , emailTemplates = require('email-templates')
  , nodemailer     = require('nodemailer');
var bcrypt = require('bcrypt');

////////////////////////////////////////////////////////
// the following is from the sample one-page app by Evan
////////////////////////////////////////////////////////
/*
  Given a plaintext password string, uses bcrypt to salt + hash the password
  The callback takes exactly one argument, which is populated by the bcrypt'ed
  password
*/
var encryptPassword = function(password, cb) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      cb(hash);
    });
  });
};

////////////////////////////////////////////////////////
// the following is from the sample one-page app by Evan
////////////////////////////////////////////////////////
/*
  Given a password and bcrypt password hash, check if they are the same
  The callback takes exactly one argument, which is true if they are a match,
  and false otherwise
*/
var comparePassword = function(password, pwhash, cb) {
  bcrypt.compare(password, pwhash, function(err, pwmatch) {
    cb(pwmatch);
  });
};

////////////////////////////////////////////////////////
// the following is from the sample one-page app by Evan
////////////////////////////////////////////////////////
/*
  For both login and create user, we want to send an error code if the user
  is logged in, or if the client did not provide a username and password
  This function returns true if an error code was sent; the caller should return
  immediately in this case
*/
var isLoggedInOrInvalidBody = function(req, res) {

    if (req.currentUser) {
        utils.sendErrResponse(res, 403, 'There is already a user logged in.');
        return true;
    } else if (!(req.body.email && req.body.password)) {
        utils.sendErrResponse(res, 400, 'Email or password not provided.');
        return true;
    }
    return false;
};

////////////////////////////////////////////////////////
// the following is from the sample one-page app by Evan
////////////////////////////////////////////////////////
/*
  Assume the API is accessed via browser -- express-sessions module will
  handle cookie passing for server-side sessions. If we didn't have a browser
  handling cookies then we'd have to pass an API authentication token back
  to the user

  This function will check to see that the provided username-password combination is valid.
  For empty username or password, or if the combination is not correct, an error will be
  returned.

  An already-logged in user is not allowed to call the login API again; an attempt
  to do so will result in an error code 403.

  POST /users/login
  Request body:
    - email
    - password
  Response:
    - success: true if login succeeded; false otherwise
    - content: on success, an object with a single field 'user', the object of the logged in user
    - err: on error, an error message
*/
router.post('/login', function(req, res) {
    if (isLoggedInOrInvalidBody(req, res)) {
        return;
    }

    // Sanitize username and password inputs (Code taken from R9 demo code by Evan Wang and
    var email = utils.sanitizeInput(req.body.email);
    var password = utils.sanitizeInput(req.body.password);

    // check email format
    if(!(utils.validateEmail(email))) {
        utils.sendErrResponse(res, 400, 'That is not a valid email.')
    }
    else {
        console.log("about to find user");
        User.findOne({
        email: email
        }, function(err, user) {
            console.log("done finding user");
            console.log(user);
            if (user) {
                console.log("about to compare password");
                comparePassword(password, user.pwhash, function(pwmatch) {
                    console.log("pwmathc");
                    console.log(pwmatch);
                    if(pwmatch) {
                        req.session.userId = user._id;
                        utils.sendSuccessResponse(res, {
                            user: user
                        });
                    } else {
                        utils.sendErrResponse(res, 403, 'Username or password invalid.');
                    }
                });

            } else {
                utils.sendErrResponse(res, 403, 'Username or password invalid.');
            }
        });
    }
});


/*
  POST /users/logout
  Request body: empty
  Response:
    - success: true if logout succeeded; false otherwise
    - err: on error, an error message
*/
router.post('/logout', function(req, res) {
    if (req.currentUser) {
        delete req.session.userId;
        delete req.session.currentPage;
        utils.sendSuccessResponse(res);
    } else {
        utils.sendErrResponse(res, 403, 'There is no user currently logged in.');
  }
});

/*
  Create a new user in the system.

  All usernames in the system must be distinct. If a request arrives with a username that
  already exists, the response will be an error.

  This API endpoint may only be called without an existing user logged in. If an existing user
  is already logged in, it will result in an error code 403.

  Does automatically log in the user.

  POST /users
  Request body:
    - password
    - firsname
    - lastname
    - email
  Response:
    - success: true if user creation succeeded; false otherwise
    - err: on error, an error message
*/

router.post('/', function(req, res) {
    if (isLoggedInOrInvalidBody(req, res)) {
        return;
    }
    // Sanitize user inputs
    var email = utils.sanitizeInput(req.body.email);
    var password = utils.sanitizeInput(req.body.password);
    var lastname = utils.sanitizeInput(req.body.lastname);
    var firstname = utils.sanitizeInput(req.body.firstname);

    encryptPassword(password, function(pwhash) {
        if(!(utils.validateEmail(email))) {
            utils.sendErrResponse(res, 400, 'That is not a valid email.');
        }
        else {
            var new_user = new User({
                pwhash: pwhash,
                lastName: lastname,
                firstName: firstname,
                email: email,
                subscribed: true
            });
            new_user.save(function(err, result) {
                if(err) {
                    // 11000 and 11001 are MongoDB duplicate key error codes
                    if (err.code && (err.code === 11000 || err.code === 11001)) {
                        utils.sendErrResponse(res, 400, 'That email is already taken!');
                    } else {
                        utils.sendErrResponse(res, 500, 'An unknown DB error occurred.');
                    }
                } else {
                    req.session.userId = new_user._id;

                    try {
                    	var locals = {
	                        email: email,
	                        subject: "Successful Registration!",
	                        name: firstname
	                    };
                    	mailer.sendEmail("signup_email", locals); //Send email when user successfully registers
                    }
                    catch (err) {
                    	console.log('ERROR sending mail: ' + err);
                    }

                    utils.sendSuccessResponse(res, {
                        user: new_user
                    });
                }
            });
        }

    });
});

//delete user by email
router.delete('/:email', function(req,res) {
    var params_email = utils.sanitizeInput(req.params.email);
    User.findOne({email: params_email}, function(err, user) {
        user.remove(function(err) {
            if (err) {
                utils.sendErrResponse(res,400,'error deleting user by id');
            }
            utils.sendSuccessResponse(res);
        });
    });
});

/*
  Get the currently logged in user.

    GET /users/currentuser
    No request parameters
    Response:
    - currentUser: the currently logged in user
*/
router.get('/currentuser', function(req, res) {
    User.find({_id: req.currentUser}, function (err, user) {
    if (err) res.status(500).send(err);
    res.json({currentUser: user});
    });
});

/*
  Get whether there is a current user logged in

    GET /users/current
    No request parameters
    Response:
    - success.loggedIn: true if there is a user logged in; false otherwise
    - success.user: if success.loggedIn, the ID of the currently logged in user
*/
router.get('/current', function(req, res) {
    var param_id = utils.sanitizeInput(req.params.id);
    if (req.currentUser) {
        utils.sendSuccessResponse(res, {
            loggedIn: true,
            user: req.currentUser,
            list: param_id
        });
    } else {
        utils.sendSuccessResponse(res, {
        loggedIn: false
        });
    }
});

/*
	Subscribe a user to email notifications

    POST /users/subscribe
    No request parameters
    Response:
    - success if able to set user's subscribed value to true
    - error 500 if not
*/
router.post('/subscribe', function (req,res) {
	try {
		User.findOne({_id: req.currentUser._id}, function (err, user) {
			user.subscribed = true;
			user.save(function (err) {
				utils.sendSuccessResponse(res, { user: user, subscribed: true});
			});
		});
	}
	catch (err) {
		return res.status(500).send('No user currently logged in');
	}
});

/*
	Unsubscribe a user from email notifications

    POST /users/unsubscribe
    No request parameters
    Response:
    - success if able to set user's subscribed value to false
    - error 500 if not
*/
router.post('/unsubscribe', function (req,res) {
	try {
		User.findOne({_id: req.currentUser._id}, function (err, user) {
			user.subscribed = false;
			user.save(function(err) {
				utils.sendSuccessResponse(res, { user: user, subscribed: false});
			})
		});
	}
	catch (err) {
		return res.status(500).send('No user currently logged in');
	}
});

/*
	Change a user's given name

    POST /users/changename
    Parameters:
    - firstname
    - lastname
    Response:
    - success if name successfully changed
    - error 500 if not
*/
router.post('/changename', function (req,res) {
	User.findOne({_id: req.currentUser._id}, function (err,user) {
		user.firstName = req.body.firstname;
		user.lastName = req.body.lastname;

		user.save(function (err) {
			utils.sendSuccessResponse(res, {user: user});
		});
	});
});

/*
	Change a user's password

    POST /users/password
    Parameters:
    - password
    Response:
    - success if password successfully changed
    - error 500 if not, or if the old password isn't correct
*/
router.post('/password', function (req,res) {
    var password = utils.sanitizeInput(req.body.password);
    var oldPassword = utils.sanitizeInput(req.body.oldpassword);

	encryptPassword(password, function(pwhash) {
		User.findOne({_id: req.currentUser.id}, function (err,user) {
			comparePassword(oldPassword, user.pwhash, function(pwmatch) {
				if (pwmatch) {
					user.pwhash = pwhash;
					user.save(function(err) {
						utils.sendSuccessResponse(res, {user: user});
					});
				}
				else return res.status(500).send('Old password doesn\'t match');
			});
		});
	});
});


var smtpTransport = mailer.smtpTransport;

module.exports = router;
