var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GiftSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    claims: [{
    	type: Schema.Types.ObjectId,
    	ref: "Claim"
    }]

 } , {
    collection: 'gifts'
});

module.exports = mongoose.model('Gift', GiftSchema);
