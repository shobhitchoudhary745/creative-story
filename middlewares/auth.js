const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");

exports.auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send({
        error: {
          message: `Unauthorized.Please Send token in request header`,
        },
      });
    }
    // console.log(req.headers.authorization)
    const { userId } = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );
    const user = await userModel.findById(userId);
    if(!user){
      return next(new ErrorHandler("User not found",404));
    }
    req.user = user;
    req.userId = userId;
    // console.log(userId)
    next();
  } catch (error) {
    return res.status(401).send({ error: { message: `Unauthorized` } });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId).select("+password");
    if (!user)
      return next(new ErrorHandler("Invalid token. User not found.", 401));

    if (user.type !== "Admin")
      return next(new ErrorHandler("Restricted.", 401));

    req.user = user;

    next();
  } catch (error) {
    return next(new ErrorHandler("Unauthorized.", 401));
  }
};
