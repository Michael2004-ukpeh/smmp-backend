const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const { io } = require('../server');

exports.sendMessage = catchAsync(async (req, res, next) => {
  try {
    const { content, chatId } = req.body;

    const { _id: userId } = req.user;
    const user = await User.findById(userId);
    let chat;
    let newMessage;
    let responseMessage;
    let messagePrompts;

    if (!chatId) {
      // Create a new Chat if the message is in a fresh chat

      const title = await generateAITitle(content);

      chat = new Chat({
        user: userId,
        title: title,
      });

      await chat.save();
      io.emit('newChat', { chatId: chat._id });
      newMessage = new Message({
        user: userId,
        chat: chat.id,
        content: content,
        role: 'user',
      });
      await newMessage.save();
      let userDetails = {
        age: await user.calculateAge(),
        gender: user.gender,
      };
      //Create new chat keypair in redis
      let chatPrompts = [
        {
          role: 'system',
          content:
            'You are a healthcare assistant, List all the possible conditions associated with the symptoms, symptoms assosiated with the different conditions, their overviews, causes and treatment options based on the gender, age and symptoms given by the user as a complaint.',
        },

        { role: 'system', content: generateUserPrompt(userDetails) },
        { role: 'user', content: newMessage.content },
      ];
      await redisClient.set(String(chat.id), JSON.stringify(chatPrompts));

      chat.firstMessage = newMessage.id;
      await chat.save();

      messagePrompts = chatPrompts;
    } else {
      // Fetch last message
      chat = await Chat.findById(chatId);
      newMessage = new Message({
        user: userId,
        chat: chat.id,
        content: content,
        role: 'user',
      });
      await newMessage.save();
      let chatLastMessage = await Message.findOne({
        _id: chat.firstMessage,
      }).sort({ timestamp: -1 });
      if (chatLastMessage) {
        chatLastMessage.nextMessage = newMessage.id;
        await chatLastMessage.save();
      }
      // Fetch messages from Redis to form prompt chain
      const chatPrompts = await redisClient.get(String(chat.id));
      //   Update Chat messages
      const newChatPrompts = [
        ...JSON.parse(chatPrompts),
        { role: 'user', content: newMessage.content },
      ];

      await redisClient.set(String(chat.id), JSON.stringify(newChatPrompts));

      messagePrompts = newChatPrompts;
    }

    // Generate AI Response

    const aiStream = (await generateAIResponse(messagePrompts)).data;
    let aiResponse = {
      role: 'assistant',
      content: '',
    };
    aiStream.on('data', (chunk) => {
      const payloads = chunk.toString().split('\n\n');
      for (const payload of payloads) {
        if (payload.includes('[DONE]')) return;
        if (payload.startsWith('data:')) {
          const data = JSON.parse(payload.replace('data: ', ''));
          try {
            const chunk = data.choices[0].delta?.content;
            if (chunk) {
              aiResponse.content += chunk;
              io.emit('chatgptResChunk', {
                chatId: chat._id,
                content: aiResponse.content,
              });
            }
          } catch (err) {
            console.log(`Error with JSON.parse and ${payload}.\n${err}`);
            io.emit('resError', { chatID: chat._id, error: err });
          }
        }
      }
    });
    aiStream.on('end', async () => {
      // Create Message Document

      responseMessage = new Message({
        user: userId,
        chat: chat.id,
        content: aiResponse,
        role: 'assistant',
      });
      await responseMessage.save();
      newMessage.nextMessage = responseMessage.id;
      io.emit('newMessage', { chatId: chat._id });
      //Persist in cache

      // Fetch messages from Redis to form prompt chain
      let chatPrompts = await redisClient.get(String(chat.id));
      //   Update Chat messages
      const newChatPrompts = [
        ...JSON.parse(chatPrompts),
        { role: 'assistant', content: responseMessage.content },
      ];

      await redisClient.set(String(chat.id), JSON.stringify(newChatPrompts));

      io.emit('updatedChats');
      res.status(200).json({
        status: 'success',
        data: {
          originalMessage: newMessage,
          responseMessage,
          chat,
        },
      });
    });

    aiStream.on('error', (err) => {
      console.log(err);
      io.emit('resError', { c, error: err });
    });
  } catch (error) {
    io.emit('resError', { error: err });
  } finally {
    await redisClient.quit();
  }
});

exports.fetchChatMessages = catchAsync(async (req, res, next) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      next(new AppError('Chat Id must be provided', 400));
    }
    const chat = await Chat.findById(chatId);
    await redisClient.connect();
    const messages = JSON.parse(await redisClient.get(String(chatId)));

    if (messages == null || !chat || (messages == null && !chat)) {
      return res.status(200).json({
        status: 'success',
        message: "Chat doesn't exist",
        count: 0,
        data: null,
      });
    }
    res.status(200).json({
      status: 'success',
      count: messages.slice(2).length,
      data: messages.slice(2),
    });
  } catch (error) {
    next(new AppError(error, 500));
  } finally {
    await redisClient.disconnect();
  }
});
