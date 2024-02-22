const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  getUpdates,
  viewUpdates,
  removeUpdates,
  removeUpdate,
} = require("../controllers/updateController");

const router = express.Router();

router.get("/getUpdates", auth, getUpdates);
router.patch("/viewUpdates", auth, viewUpdates);
router.patch("/removeUpdates", auth, removeUpdates);
router.patch("/removeUpdate/:id", auth, removeUpdate);

module.exports = router;
