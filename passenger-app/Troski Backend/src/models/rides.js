const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    passenger:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    driver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },

    pickupLocation:{
        type: String,
        required: true
    },

    dropoffLocation:{
        type: String,
        required: true
    },

    status:{
        type: String,
        enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
        default: 'requested'
    },

    pickupLatitude:{
        type: Number,
        required: true
    },

    pickupLongitude:{
        type: Number,
        required: true
    },

    dropoffLatitude:{
        type: Number,
        required: true
    },      

    dropoffLongitude:{
        type: Number,
        required: true
    }
});

const Ride = mongoose.model('Ride', rideSchema);
module.exports = Ride;