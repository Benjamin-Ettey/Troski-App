const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({

    balance:{
        type: Number,
        default: 0
    },

    driver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },

    commissionPaid:{
        type: Number,
        default: 0
    },

});

const DriverWallet = mongoose.model('DriverWallet', walletSchema);
module.exports = DriverWallet;