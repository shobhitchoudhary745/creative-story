const express = require("express");
const {
  createRoom,
  getRoomDetails,
  acceptInvitation,
  getMyStories,
  getActiveStories,
} = require("../controllers/storyRoomController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/createRoom", auth, createRoom);
router.get("/getRoomDetails/:roomId", auth, getRoomDetails);
router.get("/my_stories", getMyStories);
router.get("/active_stories", getActiveStories);
router.patch("/acceptInvitation", auth, acceptInvitation);
module.exports = router;
