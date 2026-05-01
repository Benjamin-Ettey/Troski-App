const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true
    },

    phoneNumber:{
        type: String,
        required: true,
        unique: true
    },

    profile:{
        type: String
    },

    createdAt:{
        type: Date,
        default: Date.now
    },

    role:{
        type: String,
        enum: ['passenger', 'driver'],
        default: 'passenger'
    },

    isPhoneVerified:{
        type: Boolean,
        default: false
    },

    isProfileComplete:{
        type: Boolean,
        default: false
    }

});
const User = mongoose.model('User', userSchema);
module.exports = User;