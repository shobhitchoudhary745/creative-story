const updateModel = require("../models/updateModel");
const catchAsyncError = require("../utils/catchAsyncError");

exports.getUpdates = catchAsyncError(async (req, res, next) => {
  const update = await updateModel.findOne({ owner: req.userId }).lean();
  res.status(200).send({
    status: 200,
    success: true,
    data: update,
  });
});
