const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const sendEmail = require('./../utils/sendEmail');
const tokenEncrypt = require('./../utils/tokenEncrypt');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is  required'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: [true, 'Email is already in use'],
      validate: [
        validator.isEmail,
        'Email address must be a valid email address',
      ],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be 8 or more characters'],
      select: false,
    },
    passwordChangedAt: Date,
    active: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['student', 'lecturer'],
      default: 'student',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiration: {
      type: Date,
    },
    career: {
      type: String,
    },
    course: {
      type: String,
    },
    image: {
      type: {
        imageUrl: String,
        publicId: String,
      },
    },
  },
  {
    strict: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },

    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (this.isNew === true) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (this.isDirectModified('password') === false || this.isNew) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.isCorrectPassword = async function (
  plainPassword,
  hashedPassword
) {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  // This checks if the password was changed after the token has been signed and sent
  if (this.passwordChangedAt) {
    // Convert the password changed time to timestamp
    // The Reason why we divide by 1000 is because the changedTimestamp is in milliseconds while
    // the JWTTimestamp is in seconds so we need to make sure they're both in the same format
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means the password has not been changed
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = tokenEncrypt(resetToken);
  // Set the password reset token to expire in 10 minutes
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
