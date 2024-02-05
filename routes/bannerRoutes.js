const express = require("express");
const {
  createBanner,
  getBanners,
  deleteBanner,
  getBanner,
  updateBanner,
} = require("../controllers/bannerController");
const { auth, isAdmin } = require("../middlewares/auth");
const { upload } = require("../utils/s3");

const router = express.Router();

router.post(
  "/create-banner",
  auth,
  isAdmin,
  upload.single("image"),
  createBanner
);
router.get("/get-banners", auth, getBanners);
router.delete("/delete-banner/:id", auth, isAdmin, deleteBanner);
router.get("/get-banner/:id", auth, getBanner);
router.put(
  "/update-banner/:id",
  auth,
  isAdmin,
  upload.single("image"),
  updateBanner
);

module.exports = router;
