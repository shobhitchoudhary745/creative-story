const notificationsModel = require("../models/notificationsModel");
const catchAsyncError = require("../utils/catchAsyncError");

exports.getNotification = catchAsyncError(async (req, res, next) => {
  const notification = await notificationsModel
    .findOne({ owner: req.userId })
    .populate({
      path: "notifications",
      populate: {
        path: "host",
        select: "userName profileUrl",
      },
      populate: {
        path: "genreId",
        select: "colour backgroundColour imageUrl",
      },
    })
    .lean();
  res.status(200).send({
    status: 200,
    success: true,

    data: notification,
  });
});
