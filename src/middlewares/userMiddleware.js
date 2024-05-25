exports.uploadAndParseReq = catchAsync(async (req, res, next) => {
  // Upload Logo to Cloudinary (if present)
  if (req.file.image) {
    const logoResult = await cloudinary.uploader.upload(req.file.image.path);
    req.body.logo = {
      logoUrl: logoResult.secure_url,
      publicId: logoResult.public_id,
    };
  }

  next();
});
