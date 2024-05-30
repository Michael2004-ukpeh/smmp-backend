const http = require('http');
const dotenv = require('dotenv');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const app = require('./app');
const { Server } = require('socket.io');
const colors = require('colors');
const connectDB = require('./db/db');
dotenv.config({ path: './config.env' });
const Message = require('./models/messageModel');
const Chat = require('./models/chatModel');
const User = require('./models/userModel');
const { uuid } = require('uuidv4');
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception!! Shutting Down');
  console.log({ name: err.name, message: err.message });
  process.exit(1);
});

connectDB();

const socketServer = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

socketServer.use(async (socket, next) => {
  if (!socket.handshake.headers.auth) {
    throw new Error('Authentication error, Please provide a token');
  }
  const { auth } = socket.handshake.headers;
  let token = auth.split(' ')[1];
  if (!token) {
    // If there's no token then throw exception
    throw new Error('Authentication error, Please provide a token');
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  socket.user = currentUser;
  next();
});
socketServer.on('connection', (socket) => {
  console.log(`User with socket id: ${socket.id}`);
  socket.on('open-chat', async (payload) => {
    try {
      const { chatId } = payload;
      const user = await User.findById(socket.user.id);
      let chatMessages;
      //Leave old chat
      if (user.currentRoomId) {
        socket.leave(user.currentRoomId);
      }

      if (!chatId) {
        // Create  a new Room ID
        let roomId = uuid();

        socket.join(roomId);
        user.currentRoomId = roomId;
        await user.save();
        chatMessages = [];
      } else {
        let chat = await Chat.findById(chatId);
        socket.join(chat.roomId);
        user.currentRoomId = chat.roomId;
        await user.save();
        chatMessages = await Message.find({ chat: chat.id }).sort({
          timestamp: 1,
        });
      }

      //Fetch messages if chat messages in chronological order if it exits

      socket.emit('fetch-messages', chatMessages);
    } catch (error) {
      socket.emit('error', `Error joining the chat:${error}`);
    }
  });
  socket.on('send-message', async (payload) => {
    try {
      const { chatId, content, receiverId } = payload;
      const { _id: userId } = socket.user;
      const sender = await User.findById(userId);
      const receiver = await User.findById(receiverId);
      let chat;
      let newMessage;
      let chatTitle =
        receiver.status === 'student'
          ? receiver.firstName + ' ' + receiver.lastName
          : receiver.title + ' ' + receiver.firstName + ' ' + receiver.lastName;
      if (!chatId) {
        // Create a new Chat if the message is in a fresh chat
        chat = new Chat({
          members: [userId, receiverId],
          title: chatTitle,
          roomId: sender.currentRoomId,
        });

        newMessage = new Message({
          user: userId,
          chat: chat.id,
          content: content,
        });
        chat.firstMessage = newMessage.id;

        await chat.save();
        socket.join(chat.roomId);
        await newMessage.save();
      } else {
        chat = await Chat.findById(chatId);
        newMessage = new Message({
          user: userId,
          chat: chat.id,
          content: content,
        });
        socket.join(chat.roomId);
        await newMessage.save();
        let chatLastMessage = await Message.findOne({
          _id: chat.firstMessage,
        }).sort({ timestamp: -1 });
        if (chatLastMessage) {
          chatLastMessage.nextMessage = newMessage.id;
          await chatLastMessage.save();
        }
      }

      socket.to(chat.roomId).emit('receive-message', newMessage);
    } catch (error) {
      socket.emit('error', error);
    }
  });
  socket.on('receive-message', (payload) => {
    console.log(payload);
  });
  socket.on('error', (err) => {
    if (err && err.message === 'unauthorized event') {
      socket.disconnect();
    }
    console.log(err);
  });
  socket.on('disconnnect', () => {
    socket.leave(socket.currentRoom);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.bgCyan);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION!! Closing Server then shutting down');
  console.log({ name: err.name, message: err.message });
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { server };
