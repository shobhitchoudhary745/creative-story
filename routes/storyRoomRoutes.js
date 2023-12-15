const express = require('express');
const { createRoom, getRoomDetails, acceptInvitation, getRooms } = require('../controllers/storyRoomController');
const { auth } = require('../middlewares/auth');
const router = express.Router();

router.post("/createRoom",auth,createRoom);
router.get("/getRoomDetails/:roomId",auth,getRoomDetails);
router.get("/getRooms",getRooms);
router.patch("/acceptInvitation",auth,acceptInvitation);
module.exports = router