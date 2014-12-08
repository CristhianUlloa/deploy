var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var nodemailer = require("nodemailer");

// tells app where the database is
var mongo = require('mongodb');
var mongoose = require('mongoose');

var connection_string = 'localhost/alliwant';
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ':' +
    process.env.OPENSHIFT_MONGODB_DB_PASSWORD + '@' +
    process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
    process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
    process.env.OPENSHIFT_APP_NAME;
} else {
    connection_string = 'mongodb://localhost/alliwant';
}

mongoose.connect(connection_string);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'db connection error'));
db.once('open', function callback() {
    console.log("db open--yay!");
});

var User = require('./models/user');

var index = require('./routes/index');
var users = require('./routes/users');
var claims = require('./routes/claims');
var gifts = require('./routes/gifts');
var wishlists = require('./routes/wishlists');
var test = require('./routes/test');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Authentication middleware
// Check that the user's session passed in req.session is valid
app.use(function(req, res, next) {
    if (req.session.userId) {
        // var users = db.get('users');
        User.findOne({
            _id: req.session.userId
        }, function(err, user) {
            if (user) {
                req.currentUser = user;
            } else {
                delete req.session.userId;
            }
            next();
        });
    } else {
        next();
    }
});

app.use('/', index);
app.use('/users', users);
app.use('/claims', claims);
app.use('/gifts', gifts);
app.use('/wishlists', wishlists);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    console.log("line 90");
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log("line 102");
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.log("line 114");
    res.status(err.status || 500).end();
    res.status("line 116");
    // res.render('index', {
    //     message: "TRICIA WHY WOULD YOU DO THAT?!?!?!",
    //     error: {}
    // });
    res.render('index', { title: "All I Want [for Christmas]"});
    res.status("line 121");
});


var port = process.env.OPENSHIFT_NODEJS_PORT;
var ip = process.env.OPENSHIFT_NODEJS_IP;

app.listen(port || 8080, ip);

module.exports = app;
