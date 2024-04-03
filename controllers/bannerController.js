const bannerModel = require("../models/bannerModel");
const catchAsyncError = require("../utils/catchAsyncError");
const { s3Uploadv2 } = require("../utils/s3");

exports.createBanner = catchAsyncError(async (req, res, next) => {
  const { navigationUrl, clientName } = req.body;

  if (!navigationUrl || !clientName) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }

  const results = await s3Uploadv2(req.file);
  const url = results.Location;
  const banner = await bannerModel.create({
    navigationUrl,
    clientName,
    bannerUrl: url,
  });

  res.status(201).json({
    success: true,
    banner,
    message: "New Banner Created Successfully",
  });
});

exports.getBanners = catchAsyncError(async (req, res, next) => {
    const { currentPage, resultPerPage, key } = req.query;
    let query = {};
    if (key && key.trim() != 0) {
      query.clientName = { $regex: key, $options: "i" };
    }
    const skip = resultPerPage * (currentPage - 1);
    
  
    const [bannerCount, banners] = await Promise.all([
      bannerModel.countDocuments(query),
      bannerModel.find(query).limit(resultPerPage).skip(skip).lean(),
    ]);
  
    res.status(200).send({
      success: true,
      length: bannerCount,
      banners,
    });
});

exports.deleteBanner = catchAsyncError(async (req, res, next) => {
  const banner = await bannerModel.findByIdAndDelete(req.params.id);
  if (!banner) {
    return next(new ErrorHandler("Banner not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Banner Deleted successfully",
  });
});

exports.getBanner = catchAsyncError(async (req, res, next) => {
  const banner = await bannerModel.findById(req.params.id);
  if (!banner) {
    return next(new ErrorHandler("Banner not found", 404));
  }
  res.status(200).json({
    success: true,
    banner,
    message: "Banner find successfully",
  });
});

exports.updateBanner = catchAsyncError(async (req, res, next) => {
  const banner = await bannerModel.findById(req.params.id);
  const { navigationUrl, clientName } = req.body;
  if (!banner) {
    return next(new ErrorHandler("Banner not found", 404));
  }
  let location = "";
  if (req.file) {
    const results = await s3Uploadv2(req.file);
    location = results.Location;
  }
  if (navigationUrl) banner.navigationUrl = navigationUrl;
  if (clientName) banner.clientName = clientName;
  if (location) banner.bannerUrl = location;
  await banner.save();
  res.status(200).json({
    success: true,
    message: "Banner updated successfully",
  });
});
