const { uploadAndParseReq } = require('../middlewares/userMiddleware');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const express = require('express');
const router = express.Router();
const upload = require('./../utils/multer');

router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);
// router.post('/refresh-token', authController.refreshToken);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.patch(
  '/academic-profile',
  authController.protect,
  upload.single('image'),
  uploadAndParseReq,
  userController.updateMe
);

module.exports = router;
