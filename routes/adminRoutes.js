const express = require("express");
const { termsandcondition, privacypolicy } = require("../controllers/adminController");
const router = express.Router();


router.get("/terms_and_conditions", termsandcondition);
router.get("/privacy_policy", privacypolicy);
module.exports = router