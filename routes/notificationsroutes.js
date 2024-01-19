const express = require("express");
const { auth } = require("../middlewares/auth");
const { getNotification } = require("../controllers/notificationsController");
const router = express.Router();

router.get("/getNotification", auth, getNotification);

module.exports = router;
