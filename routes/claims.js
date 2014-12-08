var express = require('express');
var router = express.Router();
var async = require('async');

// Models
var Wishlist = require('../models/wishlist');
var Gift = require('../models/gift');
var User = require('../models/user');
var Claim = require('../models/claim');
var utils = require('../utils/utils');
var mailer = require('../mailer/models');

/**
 * Claim Object Specification
 *
 * Claim: {
 *   _id: ClaimID,
 *   claimant: UserID,
 *   percentage: Number,
 * }
 */

 /**
 * GET /claims/
 *
 * Description: Retrieve all claims belonging to the current user.
 *
 * Response: {
 *   claims: ClaimInfo[]
 *   curentPage: String
 * }
 *
 * Author: kasmus@mit.edu, edited by stahdirk
 */
router.get('/', function (req, res) {
    Claim.find({claimant: req.currentUser._id}, function (err, claimList) {
        if (err) res.status(500).send(err);
        var claims = [];

        // for each claim, figure out which gift and wishlist it corresponds to
        async.each(claimList,
            function(entry, callback) {
                var claim = {};
                claim.id = entry._id;
                claim.percentage = entry.percentage;

                // find the corresponding gift
                Gift.findOne({claims: entry._id}, "_id title description claims", function (err, gift) {

                    if (err) {
                        return res.status(500).send(err);
                    }
                    if (!gift) {
                        return res.status(404).send(entry._id);
                    }
                    claim.gift = gift;

                    // find the corresponding wishlist
                    Wishlist.find({gifts: gift._id}, "_id title owner gifts", function (err, wishlists) {
                        var wishlist = wishlists[0];
                        if (wishlist.gifts.indexOf(gift._id) === -1) return res.status(400).send("gift not found on current wishlist");

                        User.findOne({_id: wishlist.owner}, "_id firstName lastName", function(err, user) {
                            claim.owner = {_id: user._id, firstname: user.firstName, lastname: user.lastName};

                            if (err) return res.status(500).send(err);
                            if (!wishlist) return res.status(404).send(gift._id);
                            claim.wishlist = wishlist;
                            claims.push(claim);
                            callback();
                        });
                    });
                });
            },
            function(err) { //callback - this executes after all the claims have been located
                if (err) return res.status(500).send(err);
                return res.status(200).json(claims);
            }
        );
    });
});

/**
 * POST /claims/
 *
 * Description: Create a new Claim.
 *
 * Request: {
 *   claim: Claim
 *   wishlist_id: WishlistID
 *   gift_id: GiftID
 * }
 *
 * Response: {
 *   claim: Claim // created Claim
 * }
 *
 * Author: kasmus@mit.edu
 */
router.post('/', function (req, res) {
    // Sanitize user input
    var percentage = utils.sanitizeInput(req.body.claim.percentage);

    if (percentage > 100 || percentage < 5 || percentage%5 != 0) {
        return res.status(401).send("bad percentage");
    }

    // Create a new claim.
    var newClaim = new Claim({
        claimant: req.currentUser._id,
        percentage: percentage
    });

    var wishlist_id = utils.sanitizeInput(req.body.wishlist_id);
    var gift_id = utils.sanitizeInput(req.body.gift_id);
    // Save the newly-created claim and return it.
    Wishlist.findById(wishlist_id, function (err, wishlist) {
        if (err) return res.status(500).send(err);
        if (!wishlist) return res.status(404).send(wishlist_id);
        if (wishlist.sharedWith.indexOf(req.currentUser.email) === -1 && !wishlist.isPublic) return res.status(401).send('Unauthorized');
        if (wishlist.gifts.indexOf(gift_id) === -1) return res.status(400).send("gift not found on current wishlist");

        Gift.findById(gift_id).populate("claims").exec(function (err, gift) {
            if (err) return res.status(500).send(err);
            if (!gift) return res.status(404).send(gift_id);

            // check if adding this claim percentage is acceptable
            var sum = 0;
            gift.claims.forEach(function(claim) {
                sum += claim.percentage;
                if (sum + newClaim.percentage > 100) {
                    return res.status(400).send("adding this percentage would go over 100");
                }
            });

            // add this claim to the list and save
            gift.claims.push(newClaim._id);
            gift.save(function(err) {
                if (err) return res.status(500).send(err);
                newClaim.save(function (err) {
                    if (err) return res.status(500).send(err);
                    Gift.findById(gift_id).populate("claims").exec(function(err, gift) {
                        if (err) return res.status(500).send(err);
                        if (!gift) return res.status(404).send(gift_id);

                        // check if adding this claim percentage is acceptable
                        var sum = 0;
                        gift.claims.forEach(function(claim) {
                            sum += claim.percentage;
                        });

                        claimant_ids = [];
                        for(i = 0; i < gift.claims.length; i++) {
                            claimant_ids.push(gift.claims[i].claimant);
                        }
                        if(sum === 100) {
                            // send email for fully claimed gift
                            if(gift.claims.length > 1) {
                                User.find({"_id": {$in:claimant_ids}}, function(err, users) {
                                    if (err) return res.status(500).send(err);
                                    user_emails = [];
                                    user_names = [];
                                    for(i = 0; i < users.length; i++) {
                                        user_emails.push(users[i].email);
                                        user_names.push(users[i].firstName);
                                    }
                                    var locals = {
                                        email: user_emails,
                                        subject: "A gift you claimed has been modified.",
                                        giftName: gift.title,
                                        others: user_names,
                                        listUrl: "http://alliwant-ulloac.rhcloud.com/direct/" +wishlist_id
                                    }
                                    mailer.sendEmail("split_claim_full", locals);
                                });
                            }
                        }
                        return res.status(200).json({claim: newClaim, gift: gift});

                    });
                });
            });
        });
    });
});

/**
 * PUT /claims/
 *
 * Description: Update a Claim.
 *
 * Path Params:
 *   id - GiftID identifier string
 *
 * Request: {
 *   claim: Claim
 *   wishlist_id: WishlistID
 * }
 *
 * Response: {
 *   claim: Claim // created Claim
 * }
 *
 * Author: kasmus@mit.edu
 */
router.put('/:id', function (req, res) {
    // Sanitize user inputs
    var percentage = utils.sanitizeInput(req.body.claim.percentage);
    var param_id = utils.sanitizeInput(req.params.id);

    if (percentage > 100 || percentage < 5 || percentage%5 != 0) {
        return res.status(401).send("bad percentage");
    }

    // Create a new claim.
    var newClaim = new Claim({
        claimant: req.currentUser._id,
        percentage: percentage
    });

    var wishlist_id = utils.sanitizeInput(req.body.wishlist_id);
    // make sure the claim is being updated on a wishlist where the user is authorized
    Wishlist.findById(wishlist_id, function (err, wishlist) {
        if (err) return res.status(500).send(err);
        if (!wishlist) return res.status(404).send(wishlist_id);
        if (wishlist.sharedWith.indexOf(req.currentUser.email) === -1 && !wishlist.isPublic) return res.status(401).send('Unauthorized');
        if (wishlist.gifts.indexOf(param_id) === -1) return res.status(400).send("gift not found on current wishlist");

        // find the gift to update a claim on
        Gift.findById(param_id).populate("claims").exec(function (err, gift) {
            if (err) return res.status(500).send(err);
            if (!gift) return res.status(404).send(param_id);

            // find the claim to update
            var claimToUpdate;
            //gift.claims.forEach(function(entry) { //forEach is asynchronus...
            async.each(gift.claims,
                function (claim, callback) {
                    if (String(claim.claimant) == String(req.currentUser._id)) {
                        claimToUpdate = claim;
                        callback();
                    } else {
                        callback();
                    }
                },
                function (err) { //callback, executed after iterating through the claims

                    // can't find the user's claim on this gift
                    if (!claimToUpdate) {
                        return res.status(404).send(gift._id);
                    }

                    // check if adding this claim percentage is acceptable
                    var sum = (-1*claimToUpdate.percentage);
                    gift.claims.forEach(function(claim) {
                        sum += claim.percentage;
                        if (sum + newClaim.percentage > 100) {
                            return res.status(400).send("adding this percentage would go over 100");
                        }
                    });

                    // delete the old claim and add the updated one
                    var index = gift.claims.indexOf(claimToUpdate._id);
                    gift.claims.splice(index, 1);
                    gift.claims.push(newClaim);

                    // save the gift, remove the old claim, and save the updated claim
                    gift.save(function(err) {
                        if (err) return res.status(500).send(err);
                        newClaim.save(function (err) {
                            if (err) return res.status(500).send(err);
                            claimToUpdate.remove(function(err) {
                                /////////////////////////////////////////////////////////////////////////////
                                claimant_ids = [];
                                for(i = 0; i < gift.claims.length; i++) {
                                    claimant_ids.push(gift.claims[i].claimant);
                                }
                                if(sum === 100) {
                                    // send email for fully claimed gift
                                    if(gift.claims.length > 1) {
                                        User.find({"_id": {$in:claimant_ids}}, function(err, users) {
                                            if (err) return res.status(500).send(err);
                                            user_emails = [];
                                            user_names = [];
                                            for(i = 0; i < users.length; i++) {
                                                user_emails.push(users[i].email);
                                                user_names.push(users[i].firstName);
                                            }
                                            var locals = {
                                                email: user_emails,
                                                subject: "A gift you claimed has been modified.",
                                                giftName: gift.title,
                                                others: user_names
                                            }
                                            mailer.sendEmail("split_claim_full", locals);
                                        });
                                    }
                                }

                                /////////////////////////////////////////////////////////////////////////////
                                if (err) return res.status(500).send(err);
                                return res.status(200).json({claim: newClaim, gift: gift});
                            });
                        });
                    });
                }
            );
        });
    });
});


/**
 * DELETE /claims/:id
 *
 * Description: Deletes the specified Claim.
 *
 * Path Params:
 *   id - GiftID identifier string
 *
 * Response: {
 *   claimID: claimID
 * }
 *
 * Author: kasmus@mit.edu, edited by stahdirk
 */
 // The id is for the gift, and whatever claim the current user has on it is
 // removed (because they should never have more than one).
router.delete('/:id', function (req, res) {
    var param_id = utils.sanitizeInput(req.params.id);

    Gift.findById(param_id, function (err, gift) {
        if (err) return res.status(500).send(err);
        if (!gift) return res.status(404).send(req.params.gift);

        // find the claim made by this user
        var claimToDelete;
        async.each(gift.claims,
            function (entry, callback) {
                Claim.findById(entry, function(err, claim) {
                    if (err) return res.status(500).send(err);
                    if (String(claim.claimant) == String(req.currentUser._id)) {
                        claimToDelete = claim;
                    }
                    callback();
                });
            },
            function (err) { //callback, executed after iterating through the claims

                // can't find the user's claim on this gift
                if (!claimToDelete) {
                    return res.status(404).send(gift._id);
                }

                // check if the claim may be deleted
                if (gift.percentage == 100 && gift.claims.length > 1) {
                    return res.status(400).send("can't unclaim a split gift that has been fully covered");
                }

                // remove the claim from the list of claims on this gift
                var index = gift.claims.indexOf(claimToDelete._id);
                gift.claims.splice(index, 1);

                gift.save(function(err) {
                    if (err) return res.status(500).send(err);
                    // remove the claim from the claims table
                    claimToDelete.remove(function(err) {
                        if (err) return res.status(500).send(err);
                        return res.status(200).json({claimID: claimToDelete._id, gift: gift});
                    });
                });
            }
        );
    });
});

module.exports = router;
