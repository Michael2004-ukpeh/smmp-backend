const catchAsync = require('../utils/catchAsync');
const cloudinary = require('./../utils/cloudinary');

exports.uploadAndParseReq = catchAsync(async (req, res, next) => {
  // Upload Logo to Cloudinary (if present)

  if (req.file) {
    const imageResult = await cloudinary.uploader.upload(req.file.path);

    req.body.image = {
      imageUrl: imageResult.secure_url,
      publicId: imageResult.public_id,
    };
  }

  next();
});
