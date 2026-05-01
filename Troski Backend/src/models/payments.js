const mongoose = require('mongoose');
const { create } = require('./users');

const paymentSchema = new mongoose.Schema({
    ride:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
 
    amount:{
        type: Number,
        required: true
    },

    paymentMethod:{
        type: String,
        enum: ['card', 'cash', 'mobile_money'],
        default: 'mobile_money'
    },
 
    status:{
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },

    authorizationURL:{
        type: String
    },

    createdAt:{
        type: Date,
        default: Date.now
    },

    paidAt:{
        type: Date
    }

});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;