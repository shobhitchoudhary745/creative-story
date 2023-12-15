const storyRoomModel = require("../models/storyRoomModel");
const catchAsyncError = require("../utils/catchAsyncError");

exports.createRoom = catchAsyncError(async (req, res, next) => {
  const { roomName, theme, description, participants, numberOfRounds } =
    req.body;
  const room = await storyRoomModel.create({
    roomName,
    theme,
    description,
    admin: req.userId,
    participants,
    numberOfRounds,
  });
  res.status(201).send({
    status: 201,
    success: true,
    data: room,
    message: "room Created Successfully",
  });
});

exports.getRoomDetails = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;
  const roomDetails = await storyRoomModel
    .findById(roomId)
    .populate("admin", "name email")
    .populate("participants._id", "name email");
  res.status(200).send({
    status: 200,
    success: true,
    data: roomDetails,
    message: "room Details",
  });
});

exports.acceptInvitation = catchAsyncError(async (req, res, next) => {
  const { userId, roomId } = req.body;
  const roomDetails = await storyRoomModel.findById(roomId);
  roomDetails.participants.map((data) => {
    if (data._id == userId) {
      data.invitationAccepted = true;
    }
  });
  await roomDetails.save();

  res.status(202).send({
    status: 202,
    success: true,
    data: roomDetails,
    message: "Invitation Accepted",
  });
});

exports.getRooms = catchAsyncError(async (req, res, next) => {
  const { status } = req.query;
  console.log(status);
  if(1+1===2)
  res.status(200).send();
  else{
    let userId = req.userId;
    const rooms = await storyRoomModel.find({
      $or: [
        { admin: userId },
        {
          "participants": {
            $elemMatch: {
              _id: userId,
              invitationAccepted: false
            }
          }
        }   
      ],
      status
    });
    
    res.status(200).send({
      status:200,
      length:rooms.length,
      data:rooms
    });
  }
 
});
