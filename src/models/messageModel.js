const mongoose = require('mongoose');
const validator = require('validator');

const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'User must have a sender'],
    },
    chat: {
      type: mongoose.Schema.ObjectId,
      ref: 'Chat',
    },
    nextMessage: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
    },
    content: {
      type: String,
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

const Message = mongoose.model('Message', messageSchema, 'messages');
module.exports = Message;
