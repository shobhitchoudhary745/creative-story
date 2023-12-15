const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const {
  register,
  login,
  deleteUser,
  getOtpToForgotPassword,
  submitOtpToForgotPassword,
  submitOtpForEmailVerification,
  getMyProfile,
  changePassword,
  updateProfile,
} = require("../controllers/userController");
const sendEmail = require("../utils/email");

router.post("/register", register);
router.post("/login", login);
router.delete("/deleteUser", auth, deleteUser);
router.post("/email", sendEmail);
router.post("/getOtpToForgotPassword/:email", getOtpToForgotPassword);
router.post("/submitOtpToForgotPassword", submitOtpToForgotPassword);
router.post("/submitOtpForEmailVerification", submitOtpForEmailVerification);
router.get("/my_profile", auth, getMyProfile);
router.patch("/change_password", auth, changePassword);
router.patch("/update_profile", auth, updateProfile);
module.exports = router;
