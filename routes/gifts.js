var express = require('express');
var router = express.Router();

// Models
var Wishlist = require('../models/wishlist');
var Gift = require('../models/gift');
var User = require('../models/user');
var Claim = require('../models/claim');
var utils = require('../utils/utils');
var nodemailer = require("nodemailer"); 
var mailer = require('../mailer/models');

var path           = require('path')
  , templatesDir   = path.resolve(__dirname, '..', 'templates')
  , emailTemplates = require('email-templates')
  , nodemailer     = require('nodemailer');


/**
 * Gift Object Specification
 *
 * Gift: {
 *   _id: GiftID,
 *   title: String,
 *   description: String,
 *   claims: [ClaimID]
 * }
 */

/**
 * POST /gifts/
 *
 * Description: Create a new Gift.
 *
 * Request: {
 *   gift: Gift
 *   wishlist_id: WishlistID
 * }
 *
 * Response: {
 *   gift: Gift // created Gift
 * }
 *
 * Author: kasmus@mit.edu
 */
router.post('/', function (req, res) {
    // Sanitize user inputs
    var title = utils.sanitizeInput(req.body.gift.title);
    var description = utils.sanitizeInput(req.body.gift.description);
    var wishlist_id = utils.sanitizeInput(req.body.wishlist_id);

    // Create a new gift with the provided title and description, belonging to the current wishlist.
    var newGift = new Gift({
        title: title,
        description: description
    });

    // Save the newly-created gift and return it.
    Wishlist.findById(wishlist_id, function (err, wishlist) {

        if (err) return res.status(500).send(err);
        if (!wishlist) return res.status(404).send(wishlist_id);
        if (String(wishlist.owner) != String(req.currentUser._id)) return res.status(401).send('Unauthorized');

        wishlist.gifts.push(newGift._id);
        wishlist.save(function(err) {
            if (err) return res.status(500).send(err);
            newGift.save(function(err) {
                if (err) return res.status(500).send(err);
                return res.status(200).json({gift: newGift});
            });
        });
    });
});

/**
 * GET /gifts/:id
 *
 * Description: Retrieves the specified gift.
 *
 * Path Params:
 *   id - GiftID identifier string
 *
 * Request: {
 *   wishlist_id: WishlistID
 * }
 *
 * Response: {
 *   gift: Gift
 * }
 *
 * Author: kasmus@mit.edu
 */
router.get('/:wishlist_id/:gift_id', function (req, res) {
    var wishlist_id = utils.sanitizeInput(req.params.wishlist_id);
    var gift_id = utils.sanitizeInput(req.params.gift_id);

	Wishlist.findById(wishlist_id, function (err, wishlist) {
		if (err) return res.status(500).send(err);
		if (!wishlist) return res.status(404).send(wishlist_id);
		if (wishlist.owner.toString() !== req.currentUser._id.toString() && wishlist.sharedWith.indexOf(req.currentUser.email) === -1 && !wishlist.isPublic) {
			return res.status(401).send('Unauthorized');
		}

		if (wishlist.gifts.indexOf(gift_id) === -1) {
			return res.status(400).send("gift not found on current wishlist");
		}

		var claimantsToPopulate = {
			path: 'claims.claimant',
			model: 'User'
		};

		
		Gift.findById(gift_id).populate('claims').exec(function (err, gift) {
            if (err) return res.status(500).send(err);

			//populate claimant
            Wishlist.populate(gift, claimantsToPopulate, function (err, gift) {
    			if (err) return res.status(500).send(err);
    			if (!gift) return res.status(404).send(gift_id);
    			return res.json({gift: gift});
            });
		});
	});
});

/**
 * PUT /gifts/:id
 *
 * Description: Modifies the specified Gift.
 *
 * Path Params:
 *   id - GiftID identifier string
 *
 * Request: {
 *   gift: Gift
 *   wishlist_id : WishlistID
 * }
 *
 * Response: {
 *   gift: Gift // after editing
 * }
 *
 * Author: kasmus@mit.edu
 */
router.put('/:id', function (req, res) {
    var param_id = utils.sanitizeInput(req.params.id);
    var wishlist_id = utils.sanitizeInput(req.body.wishlist_id);
    var gift_id = utils.sanitizeInput(req.body.gift_id);
    var gift_title = utils.sanitizeInput(req.body.gift.title);
    var gift_description = utils.sanitizeInput(req.body.gift.description);

    Wishlist.findById(wishlist_id, function (err, wishlist) {
        if (err) return res.status(500).send(err);
        if (!wishlist) return res.status(404).send(wishlist_id);
        if (wishlist.owner.toString() !== req.currentUser._id.toString()) {
            return res.status(401).send('Unauthorized');
        }
    if (wishlist.gifts.indexOf(param_id) === -1) return res.status(400).send("gift not found on current wishlist");

        // Find the specified gift to edit.
        Gift.findById(param_id, function (err, gift) {
            if (err) return res.status(500).send(err);
            if (!gift) return res.status(404).send(gift_id);

            // If values were set in the request, edit them in the database.
            if (gift_title) gift.title = gift_title;
            if (gift_description !== undefined) gift.description = gift_description;


            // When a gift is edited, alert the claimants that it has been modified

            claim_ids = [];
            for(i = 0; i < gift.claims.length; i++) {
                claim_ids.push(gift.claims[i]);                  
            }

            claimant_ids = [];
            Claim.find({"_id": {$in:claim_ids}}, function(err, claims) {
                if (err) return res.status(500).send(err);
                for(i = 0; i < claims.length; i++) {
                    claimant_ids.push(claims[i].claimant);
                }

                User.find({"_id": {$in:claimant_ids}, "subscribed": true}, function(err, users) {
                    if (err) return res.status(500).send(err);
                    for(i = 0; i < users.length; i++) {
                        var locals = {
                            email: users[i].email,
                            subject: "A gift you claimed has been modified.",
                            name: users[i].firstName,
                            listName: wishlist.title,
                            listDesc: wishlist.description,
                            sharer: req.currentUser.firstName
                        }
                        mailer.sendEmail("modified_gift", locals);
                    }                    
                });
            });


            // Save the newly-edited gift and return it.
            gift.save(function(err) {
                if (err) return res.status(500).send(err);
                return res.status(200).json({gift: gift});
            });
        });
    });
});

/**
 * DELETE /gifts/:id
 *
 * Description: Deletes the specified Gift.
 *
 * Path Params:
 *   id - GiftID identifier string
 *
 * Request: {
 *   wishlist_id : WishistID
 * }
 *
 * Response: {
 *   giftID: giftID
 * }
 *
 * Author: kasmus@mit.edu
 */
router.delete('/:id', function (req, res) {
    // Sanitize user inputs
    var param_id = utils.sanitizeInput(req.params.id);
    var wishlist_id = utils.sanitizeInput(req.body.wishlist_id);

    Wishlist.findById(wishlist_id, function (err, wishlist) {
        if (err) return res.status(500).send(err);
        if (!wishlist) return res.status(404).send(wishlist_id);
        if (wishlist.owner.toString() !== req.currentUser._id.toString()) {
            return res.status(401).send('Unauthorized');
        }
        if (wishlist.gifts.indexOf(param_id) === -1) return res.status(400).send("gift not found on current wishlist");

        wishlist.gifts.remove(param_id);
        wishlist.save(function(err) {
            if (err) return res.status(500).send(err);

            Gift.findById(param_id, function(err, gift) {
                if (err) return res.status(500).send(err);
                if (!gift) return res.status(404).send(param_id);

                
                // When a gift is deleted, alert the claimants that it has been deleted

                claim_ids = [];
                for(i = 0; i < gift.claims.length; i++) {
                    claim_ids.push(gift.claims[i]);                  
                }

                claimant_ids = [];
                Claim.find({"_id": {$in:claim_ids}}, function(err, claims) {
                    if (err) return res.status(500).send(err);
                    for(i = 0; i < claims.length; i++) {
                        claimant_ids.push(claims[i].claimant);
                    }

                    User.find({"_id": {$in:claimant_ids}, "subscribed": true}, function(err, users) {
                        if (err) return res.status(500).send(err);
                        for(i = 0; i < users.length; i++) {
                            var locals = {
                                email: users[i].email,
                                subject: "A gift you claimed has been deleted.",
                                name: users[i].firstName,
                                listName: wishlist.title,
                                listDesc: wishlist.description,
                                sharer: req.currentUser.firstName
                            }
                            mailer.sendEmail("deleted_gift", locals);
                        }
                    });
                });

                

                gift.remove(function(err) {
                    if (err) return res.status(500).send(err);
                    res.status(200).json({giftID: param_id});
                });
            });
        });
    });
});


var smtpTransport = mailer.smtpTransport;

module.exports = router;