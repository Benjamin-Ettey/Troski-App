const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },

    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },

    profileImage: {
        type: String,
        default: ''
    },

    isProfileComplete: {
        type: Boolean,
        default: false
    }
});
const User = mongoose.model('User', userSchema);
module.exports = User; 