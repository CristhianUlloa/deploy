//author: stahdirk
var express = require('express');
var router = express.Router();
var async = require('async');

// Models
var Wishlist = require('../models/wishlist');
var Gift = require('../models/gift');
var User = require('../models/user');
var Claim = require('../models/claim');

router.get('/', function (req,res) {
	res.send(index.html);
});

module.exports = router;