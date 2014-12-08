var express = require('express');
var url = require('url');
var router = express.Router();
var async = require('async');

// Models
var Wishlist = require('../models/wishlist');
var Gift = require('../models/gift');
var User = require('../models/user');
var Claim = require('../models/claim');
var nodemailer = require("nodemailer");
var mailer = require('../mailer/models');
var utils = require('../utils/utils');

var path           = require('path')
  , templatesDir   = path.resolve(__dirname, '..', 'templates')
  , emailTemplates = require('email-templates')
  , nodemailer     = require('nodemailer');


/**
 * Wishlist Object Specification
 *
 * Wishlist: {
 *   _id: ListID, // only in response
 *   title: String,
 *   owner: UserID // only in response,
 *	 description: String,
 * 	 isPublic: Boolean,
 *	 gifts: GiftID[],
 *	 sharedWith: String[] //emails
 * }
 */

/**
 * GET /wishlists/
 *
 * Description: Retrieve all wishlists belonging to the current user, as well
 *				as those shared with them. Returns titles and IDs only.
 *
 * Response: {
 *   userWishlists: Wishlist[]
 *   sharedWithWishlists: Wishlist[]
 * }
 *
 * Author: tdivita@mit.edu
 */
router.get('/', function (req, res) {
    Wishlist.find({owner: req.currentUser._id}, "_id title", function (err, userWishlists) {
        if (err) return res.status(500).send(err);
        Wishlist.find({sharedWith: req.currentUser.email}, "_id title", function (err, sharedWishlists) {
        	res.json({userWishlists: userWishlists, sharedWishlists: sharedWishlists});
        });
    });
});

/**
 * GET /wishlists/public
 *
 * Description: Retrieve all public wishlists. Returns titles and IDs only.
 *
 * Response: {
 *   publicWishlists: Wishlist[]
 * }
 *
 * Author: tdivita@mit.edu
 */
router.get('/public', function (req, res) {
    Wishlist.find({isPublic: true}, "_id title", function (err, publicWishlists) {
        if (err) return res.status(500).send(err);
        res.json({publicWishlists: publicWishlists});
    });
});

/**
* GET /wishlists/public/:searchterm
*
* Description: Retrieve all public wishlists that match the search term.
* Returns titles and IDs only.
*
* Response: {
* publicWishlists: Wishlist[]
* }
*
* Author: tdivita@mit.edu
*/
router.get('/public/:searchterm', function (req, res) {
    // Create a regular expression for the search terms
    var re = new RegExp(req.params.searchterm, 'i');
    // Search for public wishlists where either the title or the description
    // matches the search.
    Wishlist.find({
        $and: [
            { isPublic: true },
            { $or: [{ 'title': { $regex: re }}, { 'description': { $regex: re }}] }
        ]
    }, "_id title", function(err, publicWishlists) {
        if (err) return res.status(500).send(err);
        res.json({publicWishlists: publicWishlists});
    });
});

/**
 * POST /wishlists/
 *
 * Description: Create a new Wishlist belonging to the current user.
 *
 * Request: {
 *   wishlist: Wishlist
 * }
 *
 * Response: {
 *   wishlist: Wishlist // returns created Wishlist
 * }
 *
 * Author: tdivita@mit.edu, edited by stahdirk
 */
router.post('/', function (req, res) {
    // Sanitize username and password inputs (Code taken from R9 demo code by Evan Wang and
    var title = utils.sanitizeInput(req.body.wishlist.title);
    var description = utils.sanitizeInput(req.body.wishlist.description);

    // Create a new wishlist with the provided information.
	var newWishlist = new Wishlist({
		title: " " + title,
		owner: req.currentUser._id,
		description: description,
        isPublic: req.body.wishlist.isPublic
	});

    // Save the newly-created wishlist and return it as json.
	newWishlist.save(function(err, newWishlist) {
        if (err) return res.status(500).json(err);
        return res.status(200).json({wishlist: newWishlist});
    });
});

/**
 * GET /wishlists/:id
 *
 * Description: Retrieves the specified Wishlist.
 *
 * Path Params:
 *   id - WishlistID identifier string
 *
 * Response: {
 *   wishlist: Wishlist
 * }
 *
 * Author: tdivita@mit.edu
 */
router.get('/:id', function (req, res) {
    // Find Wishlist
    var param_id = utils.sanitizeInput(req.params.id);
    Wishlist.findById(param_id).populate('gifts').exec(function (err, wishlist) {
        if (err) return res.status(500).send(err);
        if (!wishlist) return res.status(404).send(param_id);
        
		var claimsToPopulate = {
			path: 'gifts.claims',
			model: 'Claim'
		};

        var userName = "";
        User.findOne({_id:wishlist.owner}, function(err, user) {
            if(err) {
                utils.sendErrResponse(res,400,'error finding wishlist owner name');
                return;
            }
            userName = user.firstName;

            Wishlist.populate(wishlist, claimsToPopulate, function(err, wishlist) {
                // Validate Result
                if (err) return res.status(500).send(err);
                if (!wishlist) return res.status(404).send(param_id);

                // Check Wishlist Ownership
                var owner = wishlist.owner.toString() === req.currentUser._id.toString();
                if (!owner && wishlist.sharedWith.indexOf(req.currentUser.email) === -1 && !wishlist.isPublic) {
                    return res.status(401).send('Unauthorized');
                }

                var isClaimedByMe = [];
                async.each(wishlist.gifts,
                    function(gift, callback) {
                        var claimedByMe = 0;
                        async.each(gift.claims,
                            function(claim, callback) {
                                if (claim.claimant.toString() === req.currentUser._id.toString()) {
                                    claimedByMe = claim.percentage;
                                    isClaimedByMe.push(claimedByMe);
                                }
                                callback();
                            },
                            function (err) {
                                if (err) res.status(500).send(err);
                                if (claimedByMe == 0) {
                                    isClaimedByMe.push(claimedByMe);
                                }
                            }
                        );
                        callback();
                    },
                    function (err) { //callback
                        if (err) return res.status(500).send(err);
                        console.log(isClaimedByMe)
                        return res.status(200).json({wishlist: wishlist, ownerName: userName, isOwnedBy: owner, isClaimedByMe: isClaimedByMe, user: req.currentUser});
                    }
                );
            });
        });


    });
});

/**
 * PUT /wishlists/:id
 *
 * Description: Modifies the specified Wishlist.
 *
 * Path Params:
 *   id - WishlistID identifier string
 *
 * Request: {
 *   wishlist: Wishlist
 * }
 *
 * Response: {
 *   wishlist: Wishlist // after editing
 * }
 *
 * Author: tdivita@mit.edu
 */
router.put('/:id', function (req, res) {
    // Find the specified wishlist to edit.
    var param_id = utils.sanitizeInput(req.params.id);
    Wishlist.findById(param_id).populate('gifts').exec(function (err, wishlist) {
        if (err) return res.status(500).send(err);

        var owner = wishlist.owner.toString() === req.currentUser._id.toString()
        if (!owner) {
            return res.status(401).send('Unauthorized');
        }

        // If values were set in the request, edit them in the database.
		if (req.body.wishlist.title) wishlist.title = utils.sanitizeInput(req.body.wishlist.title);
		if (req.body.wishlist.description !== undefined)
            wishlist.description = utils.sanitizeInput(req.body.wishlist.description);

        // Author: ulloac@mit.edu
        // When a wishlist is edited, alert the claimants of the gifts within the list that it has been modified

        claim_ids = [];
        for(i = 0; i < wishlist.gifts.length; i++) {
            for(j = 0; j < wishlist.gifts[i].claims.length; j++) {
                claim_ids.push(wishlist.gifts[i].claims[j]);
            }
        }

        claimant_ids = [];
        Claim.find({"_id": {$in:claim_ids}}, function(err, claims) {
            if (err) return res.status(500).send(err);
            for(i = 0; i < claims.length; i++) {
                claimant_ids.push(claims[i].claimant);
            }

            User.find({"_id": {$in:claimant_ids}, "subscribed": true}, function(err, users) {
                if (err) return res.status(500).send(err);
                for (i = 0; i < users.length; i++) {
                    var locals = {
                        email: users[i].email,
                        subject: "A wishlist has been modified",
                        name: users[i].firstName,
                        listName: wishlist.title,
                        listDesc: wishlist.description,
                        sharer: req.currentUser.firstName
                    }
                    mailer.sendEmail("modified_wishlist", locals);
                }
            });
        });


        // Save the newly-edited wishlist and return it.
        wishlist.save(function(err, wishlist) {
            if (err) return res.status(500).send(err);

        	// Return Wishlist
        	return res.status(200).json({wishlist: wishlist});
        });
    });
});

/**
 * PUT /wishlists/share/:id
 *
 * Description: Shares the specified Wishlist with one or more users via
 *				email address.
 *
 * Path Params:
 *   id - WishlistID identifier string
 *
 * Request: {
 *   shareWith: String[]
 * }
 *
 * Response: {
 *   wishlist: Wishlist // after editing
 * }
 *
 * Author: tdivita@mit.edu
 */
router.put('/share/:id', function (req, res) {
    if (req.body.shareWith) {
    	// Find the specified wishlist to edit.
        var share_with = req.body.shareWith;

        var param_id = utils.sanitizeInput(req.params.id);
    	Wishlist.findById(param_id).populate('gifts').exec(function (err, wishlist) {
	        if (err) return res.status(500).send(err);

            var owner = wishlist.owner.toString() === req.currentUser._id.toString()
            if (!owner && !wishlist.isPublic) {
                return res.status(401).send('Unauthorized');
            }
            var clean_emails = [];
	        // Share the wishlist with the specified set of users
            for (var i = 0; i < share_with.length; i++) {
                //Sanitize email
                var email = utils.sanitizeInput(share_with[i]);
                if(!utils.validateEmail(email)) {
                    // utils.sendErrResponse(res, 400, 'That is not a valid email.');
                    return res.status(400).send('That is not a valid email');
                }
                if (wishlist.sharedWith.indexOf(email) === -1 && (wishlist.isPublic || email.toString() != req.currentUser.email.toString())) {
                    wishlist.sharedWith.push(email)
                    if(email.toString() !== req.currentUser.email) {
                        clean_emails.push(email);
                    }
                }
            }
            // author: ulloac@mit.edu
            // send one email type to registered users, another to users not registered
            User.find({"email":clean_emails}, function(err, users) {
                if (err) return res.status(500).send(err);
                if(users.length > 0) {
                    for(j = 0; j < users.length; j++) {
                        if(users[j].subscribe && users[j].email && users[j].firstName && users[j].email.toString() != req.currentUser.email.toString()) {
                            var locals = {
                                email: users[j].email,
                                subject: "A wishlist has been shared with you!",
                                name: users[j].firstName,
                                listName: wishlist.title,
                                listDesc: wishlist.description,
                                sharer: req.currentUser.firstName
                            }
                            mailer.sendEmail("shared_list", locals);
                        }
                        var index = clean_emails.indexOf(users[j].email);
                        if(index > -1) {
                            clean_emails.splice(index, 1);
                        }
                    }
                }
                for(k = 0; k < clean_emails.length; k++) {
                    var locals = {
                        email: share_with[k],
                        subject: "A wishlist has been shared with you!",
                        listName: wishlist.title,
                        listDesc: wishlist.description,
                        sharer: req.currentUser.firstName
                    }
                    mailer.sendEmail("shared_list_unregistered", locals);
                }
            });

	        // Save the newly-shared wishlist and return it.
	        wishlist.save(function(err, wishlist) {
            	if (err) return res.status(500).send(err);

	        	// Return Wishlist
	        	return res.status(200).json({wishlist: wishlist});
	        });
	    });
    }
});

/**
 * DELETE /wishlists/:id
 *
 * Description: Deletes the specified Wishlist and its associated Gifts and Claims.
 *
 * Path Params:
 *   id - WishlistID identifier string
 *
 * Response: {
 *   wishlistID: WishlistID
 * }
 *
 * Author: tdivita@mit.edu, edited by stahdirk
 */
router.delete('/:id', function (req, res) {
    var param_id = utils.sanitizeInput(req.params.id);
    Wishlist.findById(param_id, function(err, wishlist) {
        if (err) return res.status(500).send(err);
        if (!wishlist) return res.status(404).send(param_id);
        if (wishlist.owner.toString() !== req.currentUser._id.toString())
            return res.status(401).send('Unauthorized');

        // author: ulloac@mit.edu
        // When a wishlist is deletd, alert the claimants of the gifts within the list that it has been deleted

        gift_ids = [];
        for(i = 0; i < wishlist.gifts.length; i++) {
            gift_ids.push(wishlist.gifts[i]);
        }

        claim_ids = [];
        Gift.find({"_id":{$in:gift_ids}}, function(err, gifts) {
            if (err) return res.status(500).send(err);
            for(i = 0; i < gifts.length; i++) {
                for(j = 0; j < gifts[i].claims.length; j++) {
                    claim_ids.push(gifts[i].claims[j]);
                }
            }
            claimant_ids = [];
            Claim.find({"_id": {$in:claim_ids}}, function(err, claims) {
                if (err) res.status(500).send(err);
                for(i = 0; i < claims.length; i++) {
                    claimant_ids.push(claims[i].claimant);
                }

                User.find({"_id": {$in:claimant_ids}, "subscribed": true}, function(err, users) {
                    if (err) return res.status(500).send(err);
                    for(i = 0; i < users.length; i++) {
                        var locals = {
                            email: users[i].email,
                            subject: "A wishlist has been deleted",
                            name: users[i].firstName,
                            listName: wishlist.title,
                            listDesc: wishlist.description,
                            sharer: req.currentUser.firstName
                        }
                        mailer.sendEmail("deleted_wishlist", locals);
                    }
                });
            });
        });


        for (var i = 0; i < wishlist.gifts.length; i++) {
        	var giftID = wishlist.gifts[i];
        	Gift.findOne({_id: giftID}, function(err, gift) {
        		// For each gift on the wishlist, find and remove all claims on it.
        		if (gift.claims) {
	        		for (var j = 0; j < gift.claims.length; j++) {
	        			var claimID = gift.claims[j];
		        		Claim.find({_id: claimID}).remove(function(err) {
				            if (err) return res.status(500).send(err);
				        });
		        	}
		        }

				// Then remove the gift itself.
				gift.remove(function(err) {
					if (err) return res.status(500).send(err);
				});
        	});
        }

        // Finally, remove the whole (now empty) wishlist.
        wishlist.remove(function(err) {
            if (err) return res.status(500).send(err);
            return res.status(200).json({wishlistID: param_id});
        });
    });
});

var smtpTransport = mailer.smtpTransport;

module.exports = router;
