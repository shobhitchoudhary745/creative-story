const express = require("express");
const { auth } = require("../middlewares/auth");
const { getUpdates } = require("../controllers/updateController");

const router = express.Router();

router.get("/getUpdates", auth, getUpdates);

module.exports = router;
