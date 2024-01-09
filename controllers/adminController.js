const catchAsyncError = require("../utils/catchAsyncError");
const storyRoomModel = require("../models/storyRoomModel");
const userModel = require("../models/userModel");
const genreModel = require("../models/genreModel");
const privacypolicyModel = require("../models/privacyPolicyModel");
const termsAndConditionModel = require("../models/termsAndConditionModel");
const ErrorHandler = require("../utils/errorHandler");

exports.termsandcondition = catchAsyncError(async (req, res, next) => {
  const termsBody = await termsAndConditionModel.find().lean();
  res.set("Content-Type", "text/html");
  res.status(200).send({ success: true, data: termsBody[0].content });
});

exports.privacypolicy = catchAsyncError(async (req, res, next) => {
  const termsBody = await privacypolicyModel.find().lean();
  res.set("Content-Type", "text/html");
  res.status(200).send({ success: true, data: termsBody[0].content });
});

exports.getAllStoryRoom = catchAsyncError(async (req, res, next) => {
  const storyCount = await storyRoomModel.countDocuments();
  const { currentPage, resultPerPage } = req.query;
  const skip = resultPerPage * (currentPage - 1);
  const rooms = await storyRoomModel
    .find()
    .populate({ path: "host", select: ["firstName", "lastName"] })
    .limit(resultPerPage)
    .skip(skip)
    .lean();
  res.status(200).send({
    success: true,
    length: storyCount,
    stories: rooms,
  });
});

exports.getStory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const story = await storyRoomModel
    .findById(id)
    .populate({ path: "host", select: ["firstName", "lastName"] })
    .lean();
  if (!story) {
    return next(new Error("Story not found", 400));
  }
  res.status(200).send({
    success: true,
    story,
  });
});

exports.updateStory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { roomName, theme, status, description } = req.body;
  const story = await storyRoomModel.findById(id);

  if (!story) {
    return next(new Error("user not found", 400));
  }
  if (roomName) story.roomName = roomName;
  if (theme) story.theme = theme;
  if (status) story.status = status;
  if (description) story.description = description;

  await story.save();

  res.status(200).send({
    success: true,
    story,
  });
});

exports.deleteStory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const story = await storyRoomModel.findByIdAndDelete(id);

  res.status(200).send({
    success: true,
    message: "Story Deleted Successfully!",
  });
});

exports.adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const admin = await userModel.findOne({ email }).select("+password");
  if (!admin) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }
  if (admin.type != "Admin") {
    return next(new ErrorHandler("You Do not have access to this route", 429));
  }

  const isMatch = admin.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }
  const token = await admin.getJWTToken();
  res.status(200).send({
    success: true,
    user: admin,
    token,
  });
});

exports.updateAdminProfile = catchAsyncError(async (req, res, next) => {
  const { firstName, lastName, mobile_no } = req.body;
  const admin = await userModel.findById(req.userId);
  if (!admin) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }
  if (firstName) admin.firstName = firstName;
  if (lastName) admin.lastName = lastName;
  if (mobile_no) admin.mobile_no = mobile_no;
  await admin.save();

  res.status(200).send({
    success: true,
    message: "Profile updated Successfully",
    user: admin,
  });
});

exports.getDashboardData = catchAsyncError(async (req, res, next) => {
  const userCount = await userModel.countDocuments();
  const storyCount = await storyRoomModel.find({});
  const genreCount = await genreModel.countDocuments();
  let activeStories = 0,
    upcomingStories = 0,
    completedStories = 0;
  for (let i of storyCount) {
    if (i.status === "active") {
      activeStories += 1;
    } else if (i.status === "upcoming") {
      upcomingStories += 1;
    } else {
      completedStories += 1;
    }
  }
  res.status(200).send({
    success: true,
    data: [
      { key: "Users", value: userCount },
      { key: "Stories", value: storyCount.length },
      { key: "Genres", value: genreCount },
      { key: "Active Stories", value: activeStories },
      { key: "Upcoming Stories", value: upcomingStories },
      { key: "Completed Stories", value: completedStories },
    ],
  });
});

exports.getAllUser = catchAsyncError(async (req, res, next) => {
  const userCount = (await userModel.countDocuments()) - 1;
  const { currentPage, resultPerPage } = req.query;
  const skip = resultPerPage * (currentPage - 1);
  const users = await userModel
    .find({ _id: { $ne: req.userId } })
    .limit(resultPerPage)
    .skip(skip)
    .lean();
  res.status(200).send({
    success: true,
    length: userCount,
    users,
  });
});

exports.getUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = await userModel.findById(id).lean();
  if (!user) {
    return next(new Error("user not found", 400));
  }
  res.status(200).send({
    success: true,
    user,
  });
});

exports.updateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { firstName, lastName, mobile, countryCode } = req.body;
  const user = await userModel.findById(id);

  if (!user) {
    return next(new Error("user not found", 400));
  }
  let userCountryCode = user.mobile_no.split(" ")[0];
  let userMobile = user.mobile_no.split(" ")[1];
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (mobile) userMobile = mobile;
  if (countryCode) userCountryCode = countryCode;

  user.mobile_no = userCountryCode + " " + userMobile;

  await user.save();

  res.status(200).send({
    success: true,
    user,
  });
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = await userModel.findByIdAndDelete(id);

  res.status(200).send({
    success: true,
    message: "User Deleted Successfully!",
  });
});

exports.updatePrivacyPolicy = catchAsyncError(async (req, res, next) => {
  const { content } = req.body;
  const privacyPolicy = await privacypolicyModel.find();
  privacyPolicy[0].content = content;
  await privacyPolicy[0].save();
  res.status(200).send({
    success: true,
    message: "Privacy Policy Content Updated Successfully!",
    privacyPolicy
  });
});

exports.updateTermsAndCondition = catchAsyncError(async (req, res, next) => {
  const { content } = req.body;
  const termsAndCondition = await termsAndConditionModel.find();
  termsAndCondition[0].content = content;
  await termsAndCondition[0].save();
  res.status(200).send({
    success: true,
    message: "Privacy Policy Content Updated Successfully!",
    termsAndCondition
  });
});

exports.getAllGenre = catchAsyncError(async (req, res, next) => {
  const genreCount = (await genreModel.countDocuments());
  const { currentPage, resultPerPage } = req.query;
  const skip = resultPerPage * (currentPage - 1);
  const genres = await genreModel
    .find({ _id: { $ne: req.userId } })
    .limit(resultPerPage)
    .skip(skip)
    .lean();
  res.status(200).send({
    success: true,
    length: genreCount,
    genres,
  });
});

exports.deleteGenre = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const genre = await genreModel.findByIdAndDelete(id);

  res.status(200).send({
    success: true,
    message: "Genre Deleted Successfully!",
  });
});

exports.getGenre = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const genre = await genreModel.findById(id).lean();
  if (!genre) {
    return next(new Error("user not found", 400));
  }
  res.status(200).send({
    success: true,
    genre,
  });
});

exports.updateGenre = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { genre, starter1, starter2, starter3 } = req.body;
  const genres = await genreModel.findById(id);

  if (!genres) {
    return next(new Error("user not found", 400));
  }
  
  if (genre) genres.genre = genre;
  if (starter1) genres.starter[0] = starter1;
  if (starter2) genres.starter[1] = starter2;
  if (starter3) genres.starter[2] = starter3;

  await genres.save();

  res.status(200).send({
    success: true,
    genres,
  });
});