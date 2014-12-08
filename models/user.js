var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    pwhash: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    subscribed: {
    	type: Boolean,
    	required: true,
    	default: true
    }

}, {
    collection: 'users'
});


module.exports = mongoose.model('User', UserSchema);
