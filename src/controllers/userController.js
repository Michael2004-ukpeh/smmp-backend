const User = require('./../models/userModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

exports.getAllUsers = factory.getAll(User);

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({ status: 'success', data: user });
});

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user Posts password data
  if (req.body.password) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /UpdateMypassword',
        400
      )
    );
  }
  // 2) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user.id,
    { active: false },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.deleteUser = factory.deleteOne(User);
