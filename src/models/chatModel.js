const mongoose = require('mongoose');
const validator = require('validator');

const chatSchema = new mongoose.Schema(
  {
    members: {
      type: [mongoose.Schema.ObjectId],
      ref: 'User',
      required: [true, 'At least 2 people are needed to get a chat'],
    },
    title: String,
    firstMessage: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
    },
    roomId: String,
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

const Chat = mongoose.model('Chat', chatSchema, 'chats');
module.exports = Chat;
