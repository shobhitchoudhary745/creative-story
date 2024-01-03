const userModel = require("../models/userModel");
const notificationsModel = require("../models/notificationsModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/email");
const { s3Uploadv2, deleteFile } = require("../utils/s3");
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
    profileUrl:user.profileUrl
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
  const { firstName, lastName, userName, email, password, mobile_no, gender } =
    req.body;
  const validGenders = ["Male", "Female", "Other"];
  if (!validGenders.includes(gender)) {
    return next(
      new ErrorHandler("Invalid Gender value. Use 'Male,Female,Other' instead.", 400)
    );
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
    email,
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

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));
  if(!user.isEmailVerfied){
    return next(new ErrorHandler("Verify Your Email before login.", 403));
  }
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
  if (!user) {
    return next(new ErrorHandler("Invalid token", 400));
  }
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
  const { gender, mobile_no,firstName,lastName,profileUrl } = req.body;
  const user = await userModel.findById(id);
  if (gender) user.gender = gender;
  if (mobile_no) user.mobile_no = mobile_no;
  if(firstName) user.firstName = firstName;
  if(lastName) user.lastName = lastName;
  if(profileUrl) user.profileUrl = profileUrl;
  await user.save();
  res.status(202).send({
    status: "Profile updated successfully",
  });
});

exports.uploadProfile = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  const userId = req.userId;
  if (!file) return next(new ErrorHandler("Invalid Image", 401));
  const results = await s3Uploadv2(file,userId);
  const location = results.Location && results.Location;
  return res.status(201).json({ data: { location } });
});

exports.deleteProfile = catchAsyncError(async (req, res, next) => {
  const url = req.body.url
  deleteFile(url,res,req.userId);
  // return res.status(201).json({ data });
});