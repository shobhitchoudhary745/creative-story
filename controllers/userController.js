const userModel = require("../models/userModel");
const notificationsModel = require("../models/notificationsModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/email");
const sendData = async (user, statusCode, res,purpose) => {
  const token = await user.getJWTToken();
  const newUser = {
    firstName: user.name,
    lastName:user.lastname,
    email: user.email,
    mobile_no: user.mobile_no,
    gender: user.gender,
    isEmailVerfied: user.isEmailVerfied,
    _id: user._id,
    userName:user.userName
  };
  if(purpose){
    res.status(statusCode).json({
      status:"otp send successfully"
    });
  }
  else{
    res.status(statusCode).json({
      user: newUser,
      token,
      status:"user login successfully"
    });
  }
  
};

exports.register = catchAsyncError(async (req, res, next) => {
  const { firstName, lastName, userName, email, password, mobile_no, gender } = req.body;
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
    userName
  });
  const owner = user._id;
  await notificationsModel.create({
    owner,
  });
  const options = {
    email,
    subject: "Email Verification",
    html: `<p>Your one time OTP password is <b>${otp}</b>.</p>`,
  };
  await sendEmail(options);
  sendData(user, 201, res,"register");
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    console.log("first");
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  sendData(user, 200, res);
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const user = await userModel.findByIdAndDelete(id);
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
    email,
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
  const { email, otp, password } = req.body;
  const user = await userModel.findOne({
    email,
    otp,
  });
  if (user) {
    user.password = password;
    user.otp = 0;
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
  const user = await userModel.findById(id);
  res.status(200).send({
    status: "success",
    user_data: {
      user,
    },
  });
});

exports.changePassword = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const { password } = req.body
  const user = await userModel.findById(id);
  user.password = password
  await user.save();
  res.status(202).send({
    status: "Password changed successfully",
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  const { gender, mobile_no } = req.body
  const user = await userModel.findById(id);
  if(gender)
  user.gender = gender
  if(mobile_no)
  user.mobile_no = mobile_no
  await user.save();
  res.status(202).send({
    status: "Profile updated successfully",
  });
});

