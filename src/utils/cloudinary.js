const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const cloudinary = require('cloudinary').v2;

let options = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.config(options);

module.exports = cloudinary;
