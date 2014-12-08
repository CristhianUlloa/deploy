var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClaimSchema = new Schema({
	claimant: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
    percentage: {
        type: Number,
        required: true
    }
}, {
    collection: 'claims'
});

module.exports = mongoose.model('Claim', ClaimSchema);
