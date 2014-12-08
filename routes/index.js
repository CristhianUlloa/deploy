// Author: ulloac@mit.edu

var express = require('express');
var router = express.Router();
var utils = require('../utils/utils');

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: "All I Want [for Christmas]"});
});

router.get('/direct/:id', function(req, res) {
    var param_id = utils.sanitizeInput(req.params.id);
    res.render('direct', {title: "All I Want [for Christmas]", link: param_id});
});

module.exports = router;