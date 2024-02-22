const updateModel = require("../models/updateModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.getUpdates = catchAsyncError(async (req, res, next) => {
  const update = await updateModel.findOne({ owner: req.userId }).lean();
  res.status(200).send({
    status: 200,
    success: true,
    data: update,
  });
});

exports.viewUpdates = catchAsyncError(async (req, res, next) => {
  const update = await updateModel.findOne({ owner: req.userId });
  if(!update) return next(new ErrorHandler("model not found",404))
  update.count = 0;
  await update.save();
  res.status(200).send({
    status: 200,
    success: true,
    message: "Updates viewed",
  });
});

exports.removeUpdates = catchAsyncError(async (req, res, next) => {
  const update = await updateModel.findOne({ owner: req.userId });
  if(!update) return next(new ErrorHandler("model not found",404))
  const id = req.params.id;
  update.updates = update.updates.filter((data) => data._id != id);
  await update.save();
  res.status(200).send({
    status: 200,
    success: true,
    message: "Update Removed",
  });
});
