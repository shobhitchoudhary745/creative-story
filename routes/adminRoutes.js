const express = require("express");
const {
  termsandcondition,
  privacypolicy,
  getAllStoryRoom,
  adminLogin,
  getDashboardData,
  getAllUser,
  getUser,
  updateUser,
  deleteUser,
  updateAdminProfile,
  getStory,
  updateStory,
  deleteStory,
  createPrivacyPolicy,
  updatePrivacyPolicy,
  updateTermsAndCondition,
  getAllGenre,
  deleteGenre,
  getGenre,
  updateGenre,
} = require("../controllers/adminController");
const { isAdmin, auth } = require("../middlewares/auth");
const router = express.Router();

router.get("/terms_and_conditions", termsandcondition);
router.get("/privacy_policy", privacypolicy);
router.get("/getAllStoryRooms", auth, isAdmin, getAllStoryRoom);
router.post("/login", adminLogin);
router.get("/getDashboardData", auth, isAdmin, getDashboardData);
router.get("/getAllUsers", auth, isAdmin, getAllUser);
router.get("/getUser/:id", auth, isAdmin, getUser);
router.put("/updateUser/:id", auth, isAdmin, updateUser);
router.delete("/deleteUser/:id", auth, isAdmin, deleteUser);
router.patch("/updateAdminProfile", auth, isAdmin, updateAdminProfile);
router.get("/getStory/:id", auth, isAdmin, getStory);
router.put("/updateStory/:id", auth, isAdmin, updateStory);
router.delete("/deleteStory/:id", auth, isAdmin, deleteStory);
router.put("/updatePrivacyPolicy", auth, isAdmin, updatePrivacyPolicy);
router.put("/updateTermsAndCondition", auth, isAdmin, updateTermsAndCondition);
router.get("/getAllGenres", auth, isAdmin, getAllGenre);
router.delete("/deleteGenre/:id", auth, isAdmin, deleteGenre);
router.get("/getGenre/:id", auth, isAdmin, getGenre);
router.put("/updateGenre/:id", auth, isAdmin, updateGenre);

module.exports = router;
