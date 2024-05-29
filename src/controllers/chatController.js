const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Chat = require('./../models/chatModel');
const AppError = require('./../utils/AppError');

exports.getAllChats = factory.getAll(Chats);

exports.deleteChat = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Chat.findById(id);
    await document.deleteOne();
    if (!document) {
      return next(new AppError('No document Found With That ID', 404));
    }
    // // Delete all messages from Mongodb
    // const { deletedCount } = await Message.deleteMany({ chat: this._id });

    // console.log(deletedCount);
    // //Connnect to Redis Store
    // await redisClient.connect();
    // // Delete Chat ID Key from Redis Store
    // await redisClient.del(String(this.id));
    res.status(200).json({
      status: 'Success',
      message: 'Document deleted',
      data: null,
    });
  } catch (error) {
    next(new AppError(error, 500));
  }
});
