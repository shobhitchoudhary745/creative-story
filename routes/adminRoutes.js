const express = require("express");
const { termsandcondition, privacypolicy, getAllStoryRoom } = require("../controllers/adminController");
const { isAdmin } = require("../middlewares/auth");
const router = express.Router();


router.get("/terms_and_conditions", termsandcondition);
router.get("/privacy_policy", privacypolicy);
router.get("/getAllStoryRooms", isAdmin ,getAllStoryRoom );

module.exports = router