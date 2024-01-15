const userModel = require("../models/userModel");
const notificationsModel = require("../models/notificationsModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/email");
const { s3Uploadv2, deleteFile } = require("../utils/s3");
const storyRoomModel = require("../models/storyRoomModel");

const sendData = async (user, statusCode, res, purpose) => {
  const token = await user.getJWTToken();
  const newUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobile_no: user.mobile_no,
    gender: user.gender,
    isEmailVerfied: user.isEmailVerfied,
    _id: user._id,
    userName: user.userName,
    profileUrl: user.profileUrl,
  };
  if (purpose) {
    res.status(statusCode).json({
      status: "otp send successfully",
    });
  } else {
    res.status(statusCode).json({
      user: newUser,
      token,
      status: "user login successfully",
    });
  }
};

exports.register = catchAsyncError(async (req, res, next) => {
  const {
    firstName,
    lastName,
    userName,
    email,
    password,
    mobile,
    country_code,
    gender,
  } = req.body;
  let mobile_no = "+1 ";
  if (country_code && country_code.trim()) {
    mobile_no = country_code + " " + mobile;
  } else {
    mobile_no = mobile_no + mobile;
  }

  const validGenders = ["Male", "Female", "Other"];
  if (!validGenders.includes(gender)) {
    return next(
      new ErrorHandler(
        "Invalid Gender value. Use 'Male,Female,Other' instead.",
        400
      )
    );
  }
  if (!mobile) {
    return next(new ErrorHandler("Mobile no is required", 400));
  }
  if (firstName.length <= 3) {
    return next(
      new ErrorHandler("first name must be of atleast 4 character", 400)
    );
  }
  if (lastName.length <= 3) {
    return next(
      new ErrorHandler("last name must be of atleast 4 character", 400)
    );
  }
  const existingUser = await userModel.findOne({ userName });
  if (existingUser) {
    return next(new ErrorHandler("This username is already exist", 400));
  }

  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  const user = await userModel.create({
    firstName,
    lastName,
    email,
    password,
    mobile_no,
    gender,
    otp,
    userName,
  });
  const owner = user._id;
  await notificationsModel.create({
    owner,
  });
  const options = {
    email: email.toLowerCase(),
    subject: "Email Verification",
    html: `<p>Your one time OTP password is <b>${otp}</b>.</p>`,
  };
  await sendEmail(options);
  sendData(user, 201, res, "register");
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel.findOne({ email:email.toLowerCase() }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));
  if (!user.isEmailVerfied) {
    return next(new ErrorHandler("Verify Your Email before login.", 403));
  }
  sendData(user, 200, res);
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  await notificationsModel.findByIdAndDelete(id);
  await storyRoomModel.deleteMany({ host: id });
  const user = await userModel.findByIdAndDelete(id).lean();
  if (user) {
    res.status(202).send({
      status: 202,
      message: "User Deleted Successfully!",
      success: true,
    });
  } else {
    res.status(400).send({
      status: 400,
      message: "Some error occur",
      success: true,
    });
  }
});

exports.getOtpToForgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.params;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User Not Exist with this Email!", 401));
  }
  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  const options = {
    email: email.toLowerCase(),
    subject: "Forgot Password Request",
    html: `<p>Your one time OTP password is <b>${otp}</b>.</p>`,
  };
  const send = await sendEmail(options);
  if (send) {
    user.otp = otp;
    await user.save();
    res.status(200).send({
      message: "otp send Successfully",
      status: 200,
      success: true,
    });
  } else {
    res.status(500).send({
      message: "Internal Server Error",
      status: 500,
      success: false,
    });
  }
});

exports.submitOtpToForgotPassword = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await userModel.findOne({
    email,
    otp,
  });
  if (user) {
    // user.password = password;
    user.otp = 0;
    await user.save();
    res.status(202).send({
      status: 202,
      success: true,
      message: "Otp Verify Successfully!",
    });
  } else {
    res.status(400).send({
      status: 400,
      success: false,
      message: "Invalid otp!",
    });
  }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userModel
    .findOne({
      email,
    })
    .select("+password");
  // console.log(user);
  if (user && user.otp == 0) {
    user.password = password;
    // user.otp = 0;
    await user.save();
    res.status(202).send({
      status: 202,
      success: true,
      message: "Password Changed Successfully!",
    });
  } else {
    res.status(400).send({
      status: 400,
      success: false,
      message: "Invalid otp!",
    });
  }
});

exports.submitOtpForEmailVerification = catchAsyncError(
  async (req, res, next) => {
    const { email, otp } = req.body;
    const user = await userModel.findOne({
      email,
      otp,
    });
    if (user) {
      user.otp = 0;
      user.isEmailVerfied = true;
      await user.save();
      res.status(202).send({
        status: 202,
        success: true,
        message: "Email Verified Successfully!",
      });
    } else {
      res.status(400).send({
        status: 400,
        success: false,
        message: "Invalid otp!",
      });
    }
  }
);

exports.getMyProfile = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const user = await userModel.findById(id).lean();
  if (!user) {
    return next(new ErrorHandler("Invalid token", 400));
  }
  user.country_code = user.mobile_no.split(" ")[0];
  user.mobile_no = user.mobile_no.split(" ")[1];
  res.status(200).send({
    status: "success",
    user_data: {
      user,
    },
  });
});

exports.changePassword = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).send({
      success: false,
      message: "Password not match with Confirm password",
    });
  }
  const user = await userModel.findById(id);
  user.password = password;
  await user.save();
  res.status(202).send({
    status: "Password changed successfully",
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const file = req.file;
  let location;
  if (file) {
    const results = await s3Uploadv2(file);
    location = results.Location && results.Location;
  }
  const { gender, mobile, firstName, lastName, avatar, country_code } =
    req.body;

  const user = await userModel.findById(id);
  let countrycode = user.mobile_no.split(" ")[0];
  let mobilenumber = user.mobile_no.split(" ")[1];
  if (gender) user.gender = gender;
  if (mobile) mobilenumber = mobile;
  if (country_code) countrycode = country_code;
  user.mobile_no = countrycode + " " + mobilenumber;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (location) user.profileUrl = location;
  if (avatar) user.profileUrl = avatar;

  await user.save();
  res.status(202).send({
    status: "Profile updated successfully",
  });
});

// exports.uploadProfile = catchAsyncError(async (req, res, next) => {
//   const file = req.file;
//   const userId = req.userId;
//   if (!file) return next(new ErrorHandler("Invalid Image", 401));
//   const results = await s3Uploadv2(file,userId);
//   const location = results.Location && results.Location;
//   return res.status(201).json({ data: { location } });
// });

// exports.deleteProfile = catchAsyncError(async (req, res, next) => {
//   const url = req.body.url
//   deleteFile(url,res,req.userId);
//   // return res.status(201).json({ data });
// });

exports.getAllUser = catchAsyncError(async (req, res, next) => {
  const users = await userModel.find({ _id: { $ne: req.userId } }).lean();
  res.status(200).send({
    success: true,
    length: users.length,
    users,
  });
});

exports.resendOtp = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not Found", "400"));
  }
  if (user.isEmailVerfied) {
    return next(new ErrorHandler("Email already verified", "400"));
  }

  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  user.otp = otp;
  await user.save();
  const options = {
    email: email.toLowerCase(),
    subject: "Email Verification",
    html: `<p>Your one time OTP password is <b>${otp}</b>.</p>`,
  };
  await sendEmail(options);
  res.status(200).send({
    success: "true",
    message: "otp resend successfully",
  });
});
