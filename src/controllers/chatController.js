const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Chat = require('./../models/chatModel');
const AppError = require('./../utils/AppError');

exports.getAllChats = catchAsync(async (req, res, next) => {
  const { _id: userId } = req.user;

  next();
});
