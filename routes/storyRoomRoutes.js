const express = require("express");
const {
  createRoom,
  getRoomDetails,
  acceptInvitation,
  getMyStories,
  getActiveStories,
  startStory,
  endStory,
  getUpcomingStories,
  getCompletedStories,
  createChat,
  getChat,
  addParticipants,
  removeParticipant,
} = require("../controllers/storyRoomController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/createRoom", auth, createRoom);
router.get("/getRoomDetails/:roomId", auth, getRoomDetails);
router.get("/my_stories", auth, getMyStories);
router.get("/active_stories", auth, getActiveStories);
router.get("/upcoming_stories", auth, getUpcomingStories);
router.get("/completed_stories", auth, getCompletedStories);
router.patch("/acceptInvitation/:roomId", auth, acceptInvitation);
router.patch("/startStory/:roomId", auth, startStory);
router.patch("/endStory/:roomId", auth, endStory);
router.post("/send-message/:roomId", auth, createChat);
router.get("/get-chats/:roomId", auth, getChat);
router.patch("/add-participants/:roomId", auth, addParticipants);
router.patch("/remove-participants/:roomId", auth, removeParticipant);
module.exports = router;
