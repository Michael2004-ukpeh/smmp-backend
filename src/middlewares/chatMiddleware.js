const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getUserOwn = catchAsync(async (req, res, next) => {
  console.log(req.user);
  req.query.user = req.user.id;

  next();
});
