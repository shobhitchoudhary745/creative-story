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
  uploadProfile,
  deleteProfile,
  getAllUser,
} = require("../controllers/userController");
const sendEmail = require("../utils/email");
const { upload } = require("../utils/s3");

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
router.post("/uploadProfile", auth, upload.single("image"), uploadProfile);
router.post("/deleteProfile", auth, deleteProfile);
router.get("/getAllUsers",auth,getAllUser);
module.exports = router;
