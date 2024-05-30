const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authController');
const chatController = require('./../controllers/chatController');
router.route('/').get(authController.protect, chatController.getAllChats);

module.exports = router;
