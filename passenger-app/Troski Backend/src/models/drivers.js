const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    ride:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
    },
    
   licenseNumber:{
        type: String,
        required: true,
        unique: true
   },

   totalEarnings:{
        type: Number,
        default: 0
   },

   appliedAt:{
        type: Date,
        default: Date.now
   },

   approvedAt:{
        type: Date
   },

   currentLatitude:{
        type: Number
   },   

   currentLongitude:{
        type: Number
   }, 

   lastLocationUpdate:{
        type: Date
   },

   vehicle:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
   }
});

const Driver = mongoose.model('Driver', driverSchema);
module.exports = Driver;