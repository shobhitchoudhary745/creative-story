const catchAsyncError = require("../utils/catchAsyncError");
const storyRoomModel = require("../models/storyRoomModel");
const userModel = require("../models/userModel");
const genreModel = require("../models/genreModel");
const motificationModel = require("../models/notificationsModel");
const privacypolicyModel = require("../models/privacyPolicyModel");
const termsAndConditionModel = require("../models/termsAndConditionModel");
const ErrorHandler = require("../utils/errorHandler");
const notificationsModel = require("../models/notificationsModel");
const { s3Uploadv2 } = require("../utils/s3");
const updateModel = require("../models/updateModel");
const { sendEmail } = require("../utils/email");

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
  const { currentPage, resultPerPage, key } = req.query;
  let query = {};
  if (key && key.trim() != 0) {
    query.roomName = { $regex: key, $options: "i" };
  }
  const skip = resultPerPage * (currentPage - 1);

  const [storyCount, rooms] = await Promise.all([
    storyRoomModel.countDocuments(query),
    storyRoomModel
      .find(query)
      .populate({ path: "host", select: ["firstName", "lastName"] })
      .limit(resultPerPage)
      .skip(skip)
      .lean(),
  ]);

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

  const isMatch = await admin.comparePassword(password);
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
  const [userCount, storyCount, genreCount] = await Promise.all([
    userModel.countDocuments(),
    storyRoomModel.find({}).lean(),
    genreModel.countDocuments(),
  ]);

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
  const { currentPage, resultPerPage, key } = req.query;
  let query = { _id: { $ne: req.userId } };
  if (key && key.trim() !== "") {
    query.$or = [
      { firstName: { $regex: key, $options: "i" } },
      { lastName: { $regex: key, $options: "i" } },
    ];
  }

  const skip = resultPerPage * (currentPage - 1);

  const [userCount, users] = await Promise.all([
    userModel.countDocuments(query),
    userModel.find(query).limit(resultPerPage).skip(skip).lean(),
  ]);

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
  await notificationsModel.findByIdAndDelete(id);
  await storyRoomModel.deleteMany({ host: id });
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
    privacyPolicy,
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
    termsAndCondition,
  });
});

exports.getAllGenre = catchAsyncError(async (req, res, next) => {
  const { currentPage, resultPerPage, key } = req.query;
  let query = {};
  if (key && key.trim() != 0) {
    query.genre = { $regex: key, $options: "i" };
  }
  const skip = resultPerPage * (currentPage - 1);

  const [genreCount, genres] = await Promise.all([
    genreModel.countDocuments(query),
    genreModel.find(query).limit(resultPerPage).skip(skip).lean(),
  ]);

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
  const { genre, starter, colour, backgroundColour } = req.body;
  let location;
  // console.log(starter,genre,colour)
  if (req.file) {
    const results = await s3Uploadv2(req.file);
    location = results.Location && results.Location;
  }
  const genres = await genreModel.findById(id);

  if (!genres) {
    return next(new Error("Genre not found", 400));
  }

  if (genre) genres.genre = genre;
  if (starter) genres.starter = JSON.parse(starter);
  if (colour) genres.colour = colour;
  if (backgroundColour) genres.backgroundColour = backgroundColour;
  if (location) genres.imageUrl = location;
  await genres.save();

  res.status(200).send({
    success: true,
    genres,
  });
});

exports.deleteAccount = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.params;
  const user = await userModel.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User Not Found", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) return next(new ErrorHandler("User Not Found", 400));
  const rooms = await storyRoomModel.find({
    $or: [
      { host: user._id },
      {
        participants: {
          $elemMatch: {
            _id: user._id,
            invitationAccepted: true,
          },
        },
      },
    ],
  });
  for (let room of rooms) {
    if (room.status === "active" && room.currentUser == user._id) {
      if (room.currentTurn == room.acceptedInvitation.length) {
        room.currentTurn = 1;
        room.currentUser = room.acceptedInvitation[0] || null;
      } else {
        room.currentTurn += 1;
        room.currentUser =
          room.acceptedInvitation[room.currentTurn - 1] || null;
      }
    }
    room.acceptedInvitation = room.acceptedInvitation.filter(
      (id) => id != user._id
    );
    await room.save();
  }
  await userModel.findByIdAndDelete(user._id);
  await notificationsModel.findOneAndDelete({ owner: user._id });
  await updateModel.findOneAndDelete({ owner: user._id });
  res.status(200).send({
    success: true,
    message: "Account Deleted Successfully",
  });

  const options = {
    email: user.email.toLowerCase(),
    subject: "Account Deletion Confirmation",
    html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;"></h1>
      <p style="color: #666666;">Dear ${
        user.firstName + " " + user.lastName
      }</p>
      <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">Your account has been deleted successfully.</p>
      <p style="color: #666666;">I hope to see you back soon.</p>
    </div>

    <div style="color: #888888;">
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Creative Story</span></p>
    </div>
  
  </div>`,
  };
  await sendEmail(options);
});
