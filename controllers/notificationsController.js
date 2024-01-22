const notificationsModel = require("../models/notificationsModel");
const catchAsyncError = require("../utils/catchAsyncError");

exports.getNotification = catchAsyncError(async (req, res, next) => {
    const notification = await notificationsModel.find({owner:req.userId}).populate("notifications").lean();
    res.status(200).send({
      status: 200,
      success: true,
      
      data: notification.notifications,
    });
  });