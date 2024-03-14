const userModel = require("../models/userModel");
const notificationsModel = require("../models/notificationsModel");
const updatesModel = require("../models/updateModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { sendEmail } = require("../utils/email");
const { s3Uploadv2, deleteFile } = require("../utils/s3");
const storyRoomModel = require("../models/storyRoomModel");
const jwt = require("jsonwebtoken");
const invitationModel = require("../models/invitationModel");

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
    fireBaseToken,
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
  let profileUrl =
    "https://tse4.mm.bing.net/th?id=OIP.eXWcaYbEtO2uuexHM8sAwwHaHa&pid=Api&P=0&h=180";
  const min = 1000;
  const max = 9999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  if (gender == "Female") {
    profileUrl =
      "https://tse2.mm.bing.net/th?id=OIP.mWaZ5rZ6uzhHD8kk4HM2RwHaHa&pid=Api&P=0&h=180";
  }
  const user = await userModel.create({
    firstName,
    lastName,
    profileUrl,
    email,
    password,
    mobile_no,
    gender,
    otp,
    userName,
    fireBaseToken,
  });
  const owner = user._id;
  const notifications = await notificationsModel.create({
    owner,
  });

  await updatesModel.create({
    owner,
  });
  const invitations = await invitationModel.find({ userEmail: email });
  invitations.map((invitation) =>
    notifications.notifications.push(invitation.room)
  );
  await notifications.save();
  await invitationModel.deleteMany({ userEmail: email });
  const options = {
    email: email.toLowerCase(),
    subject: "Email Verification",
    html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;">Account Verification Code</h1>
      <p style="color: #666666;">Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${otp}</p>
      <p style="color: #666666;">Use this code to verify your Account</p>
    </div>

    <div style="color: #888888;">
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Creative Story</span></p>
    </div>
  
  </div>`,
  };
  await sendEmail(options);
  sendData(user, 201, res, "register");
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password, fireBaseToken } = req.body;
  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel
    .findOne({ email: email.toLowerCase() })
    .select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));
  if (!user.isEmailVerfied) {
    return next(new ErrorHandler("Verify Your Email before login.", 403));
  }

  if (fireBaseToken) {
    user.fireBaseToken = fireBaseToken;
    await user.save();
  }

  sendData(user, 200, res);
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.userId;
  await notificationsModel.findByIdAndDelete(id);
  await updatesModel.findByIdAndDelete(id);
  const rooms = await storyRoomModel.find({
    $or: [
      { host: id },
      {
        participants: {
          $elemMatch: {
            _id: id,
            invitationAccepted: true,
          },
        },
      },
    ],
  });
  for (let room of rooms) {
    if (room.status === "active" && room.currentUser == id) {
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
      (user) => user != id
    );
    await room.save();
  }
  const user = await userModel.findByIdAndDelete(id).lean();
  if (user) {
    res.status(202).send({
      status: 202,
      message: "User Deleted Successfully!",
      success: true,
    });
  } else {
    return res.status(400).send({
      status: 400,
      message: "Some error occur",
      success: true,
    });
  }

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
    html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;">Forgot Password Code</h1>
      <p style="color: #666666;">Your one time code is:</p>
      <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${otp}</p>
      <p style="color: #666666;">Use this code to Forgot your Password</p>
    </div>

    <div style="color: #888888;">
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Creative Story</span></p>
    </div>
  
  </div>`,
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
      res.status(202).send({
        status: 202,
        token,
        user: newUser,
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
  const users = await userModel
    .find({ _id: { $ne: req.userId }, type: "User" })
    .lean();
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
    html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;">Account Verification Code</h1>
      <p style="color: #666666;">Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">${otp}</p>
      <p style="color: #666666;">Use this code to verify your Account</p>
    </div>

    <div style="color: #888888;">
      <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team Creative Story</span></p>
    </div>
  
  </div>`,
  };
  await sendEmail(options);
  res.status(200).send({
    success: "true",
    message: "otp resend successfully",
  });
});

exports.authentication = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send({
        error: {
          message: `Unauthorized.Please Send token in request header`,
        },
      });
    }

    const { userId } = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(400).send({
        authentication: false,
        success: false,
        message: "User not found",
      });
    }

    res.status(200).send({
      authentication: true,
      success: true,
      message: "User found",
    });
  } catch (error) {
    return res.status(401).send({ error: { message: `Unauthorized` } });
  }
};
