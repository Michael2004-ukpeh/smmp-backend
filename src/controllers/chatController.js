const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Chat = require('./../models/chatModel');
const AppError = require('./../utils/AppError');

exports.getAllChats = catchAsync(async (req, res, next) => {
  const { _id: userId } = req.user;

  const chats = await Chat.find({ members: userId }).populate('members');
  res.status(200).json({
    status: 'success',
    data: chats,
  });
});
