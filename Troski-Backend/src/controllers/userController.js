const { StatusCodes } = require('http-status-codes');
const User = require('../models/users');
const{upload, formatImage} = require('../middleware/multerMiddleware'); 

const completeProfile = async (req, res) => {
  const { name, email } = req.body;

  try {
    if (!name || !email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Name and email are required',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(StatusCodes.CONFLICT).json({
        message: 'Email already in use',
      });
    }

    user.name = name;
    user.email = email;

    user.isProfileComplete = true;

    await user.save();

    res.status(StatusCodes.OK).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error updating profile',
    });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'User not found',
      });
    }

    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'No file uploaded',
      });
    }

    // Save file path
    user.profileImage = `/upload/${req.file.filename}`;
    await user.save();

    res.status(StatusCodes.OK).json({
      message: 'Profile picture uploaded successfully',
      profileImage: user.profileImage,
    });

  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Upload failed',
    });
  }
};

const updateProfile = async(req,res)=> {
    const { name, email } = req.body;
};

module.exports = { completeProfile, uploadProfilePicture };