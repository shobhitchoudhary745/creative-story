const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  getUpdates,
  viewUpdates,
  removeUpdates,
} = require("../controllers/updateController");

const router = express.Router();

router.get("/getUpdates", auth, getUpdates);
router.patch("/viewUpdates", auth, viewUpdates);
router.patch("/removeUpdates/:id", auth, removeUpdates);

module.exports = router;
