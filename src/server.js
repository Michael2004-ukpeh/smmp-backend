const http = require('http');
const dotenv = require('dotenv');
const app = require('./app');
const { Server } = require('socket.io');
const colors = require('colors');
const connectDB = require('./db/db');
dotenv.config({ path: './config.env' });
const Message = require('./models/messageModel');
const Chat = require('./models/chatModel');
const User = require('./models/userModel');
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
  let token = req.headers.authorization.split(' ')[1];
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
  socket.on('open-chat', (payload) => {
    try {
      const { chatId } = payload;

      socket.join(chatId);
      //Fetch messages
    } catch (error) {
      socket.emit('error', 'Error joining the chat');
    }
  });
  socket.on('send-message', async (payload) => {
    const { chatId, content, receiver } = payload;
    const { _id: userId } = socket.user;
    const sender = await User.findById(userId);
    let chat;
    let newMessage;
    let chatTitle = receiver.firstName + ' ' + receiver.lastName;
    if (!chatId) {
      // Create a new Chat if the message is in a fresh chat
      chat = new Chat({
        members: [userId],
        title: chatTitle,
      });

      newMessage = new Message({
        user: userId,
        chat: chat.id,
        content: content,
      });
      chat.firstMessage = newMessage.id;
      await chat.save();
    } else {
      chat = await Chat.findById(chatId);
      newMessage = new Message({
        user: userId,
        chat: chat.id,
        content: content,
      });
      await newMessage.save();
      let chatLastMessage = await Message.findOne({
        _id: chat.firstMessage,
      }).sort({ timestamp: -1 });
      if (chatLastMessage) {
        chatLastMessage.nextMessage = newMessage.id;
        await chatLastMessage.save();
      }
    }
    socket.to(chat._id).broadcast('receive-message', newMessage);
  });
  socket.on('receive-message', (payload) => {});
  socket.on('disconnnect', () => {
    socket.leave('');
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
