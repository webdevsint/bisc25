const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    plusOne: {
        type: Boolean,
        default: false
    },
    plusOneName: {
        type: String,
        required: function() { return this.plusOne; },
        default: ''
    },
    transactionID: {
        type: String,
        required: true,
    },
    dueAmount: {
        type: Number,
        default: 200
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
