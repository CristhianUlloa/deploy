var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WishlistSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
    },
    isPublic: {
        type: Boolean,
        required: true,
        default: false
    },
    gifts: [{
        type: Schema.Types.ObjectId,
        ref: 'Gift'
    }],
    sharedWith: [{
        type: 'String'
    }]
}, {
    collection: 'wishlists'
});

module.exports = mongoose.model('Wishlist', WishlistSchema);
