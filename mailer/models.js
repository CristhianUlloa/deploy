/**
* Source: https://github.com/niftylettuce/node-email-templates
* Modified by: ulloac@mit.edu
**/

'use strict';

// var config = require('../config');
var nodemailer = require('nodemailer');
var path = require('path');
var templatesDir = path.resolve(__dirname, '..', 'views/mailer');
var emailTemplates = require('email-templates');

var EmailAddressRequiredError = new Error('email address required');

// create a defaultTransport using gmail and authentication that are
// storeed in the `config.js` file.
var defaultTransport = nodemailer.createTransport('SMTP', {
    service: 'Gmail',
    auth: {
        user: "alliwant.infomailer@gmail.com",
        pass: "magicalpasswd2014"
    }
});

var sendOne = function (templateName, locals, fn) {
    // make sure that we have an user email
    if (!locals.email) {
        return fn(EmailAddressRequiredError);
    }
    // make sure that we have a message
    if (!locals.subject) {
        return fn(EmailAddressRequiredError);
    }
    emailTemplates(templatesDir, function (err, template) {
        if (err) {
            //console.log(err);
            return fn(err);
        }
        // Send a single email
        template(templateName, locals, function (err, html, text) {
            if (err) {
                //console.log(err);
                return fn(err);
            }
            // if we are testing don't send out an email instead return
            // success and the html and txt strings for inspection
            if (process.env.NODE_ENV === 'test') {
                return fn(null, '250 2.0.0 OK 1350452502 s5sm19782310obo.10', html, text);
            }
            var mailOptions = {
                from: "All I Want <noreply@alliwant.com>",
                to: locals.email,
                subject: locals.subject,
                html: html,
                text: text
            }
            var transport = defaultTransport;
            transport.sendMail(mailOptions, function (err, responseStatus) {
                if (err) {
                    // return fn(err);
                    console.log("some error occurred when sending...");
                    console.log(err);
                    return res.status(500).send(err);
                }
                else {
                    console.log("MESSAGE SENT!!");
                }
                return fn(null, responseStatus.message, html, text);
            });
        });
    });
}

exports.sendEmail = function(template, locals) {
    sendOne(template, locals, function (err, responseStatus, html, text) {
        if(err) {
            console.log("error while sending!");
            console.log(err);
        }
        // TODO handle errors
    });
}

var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "alliwant.infomailer@gmail.com",
        pass: "magicalpasswd2014"
    }
});

exports.smtpTransport = smtpTransport;
