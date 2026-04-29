const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    driver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    plateNumber:{
        type: String,
        required: true,
        unique: true
    },

    color:{
        type: String
    },

    isActive:{
        type: Boolean,
        default: true
    }

});
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;