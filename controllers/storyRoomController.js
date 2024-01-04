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
  }).lean();
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
  const { userId, roomId, isAccept } = req.body;
  const roomDetails = await storyRoomModel.findById(roomId);
  roomDetails.participants.map((data) => {
    if (data._id == userId) {
      data.invitationAccepted = isAccept;
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

exports.getMyStories = catchAsyncError(async (req, res, next) => {
  let userId = req.userId;
  // console.log(userId);
  const rooms = await storyRoomModel.find();
  const arr = [];
  // const admin = rooms.filter(data=>data.adminId==userId);
  for (let data of rooms) {
    if (data.admin == userId) {
      arr.push(data);
      continue;
    }
    for (let participant of data.participants) {
      if (participant._id == userId && participant.invitationAccepted) {
        arr.push(data);
        break;
      }
    }
  }
  //   $or: [
  //     { admin: userId },
  //     {
  //       participants: {
  //         $elemMatch: {
  //           _id: userId,
  //           invitationAccepted: true,
  //         },
  //       },
  //     },
  //   ],
  // });

  res.status(200).send({
    status: 200,
    length: arr.length,
    my_stories: arr,
  });
});

exports.getActiveStories = catchAsyncError(async (req, res, next) => {
  let userId = req.userId;
  const rooms = await storyRoomModel.find({
    $and: [
      {
        $or: [
          { admin: userId },
          {
            participants: {
              $elemMatch: {
                _id: userId,
                invitationAccepted: true,
              },
            },
          },
        ],
      },
      {
        status: "active",
      },
    ],
  });

  res.status(200).send({
    status: 200,
    length: rooms.length,
    active_stories: rooms,
  });
});

exports.getUpcomingStories = catchAsyncError(async (req, res, next) => {
  let userId = req.userId;
  const rooms = await storyRoomModel.find({
    $and: [
      {
        $or: [
          { admin: userId },
          {
            participants: {
              $elemMatch: {
                _id: userId,
                invitationAccepted: true,
              },
            },
          },
        ],
      },
      {
        status: "upcoming",
      },
    ],
  });

  res.status(200).send({
    status: 200,
    length: rooms.length,
    upcoming_stories: rooms,
  });
});

exports.getCompletedStories = catchAsyncError(async (req, res, next) => {
  let userId = req.userId;
  const rooms = await storyRoomModel.find({
    $and: [
      {
        $or: [
          { admin: userId },
          {
            participants: {
              $elemMatch: {
                _id: userId,
                invitationAccepted: true,
              },
            },
          },
        ],
      },
      {
        status: "completed",
      },
    ],
  });

  res.status(200).send({
    status: 200,
    length: rooms.length,
    completed_stories: rooms,
  });
});

exports.startStory = catchAsyncError(async (req, res, next) => {
  let { roomId } = req.params;
  const room = await storyRoomModel.findById(roomId);

  if (!room) {
    res.status(400).json({ message: "Story not found" });
  }
  console.log(room.admin," ", req.userId);
  if (room.admin != req.userId) {
    res.status(403).json({ message: "You do not have access" });
  }

  if (room.status === "completed" || room.status === "active") {
    res.status(401).json({ message: "Story already completed/ongoing" });
  }

  room.status = "active";
  await room.save();

  res.status(200).json({
    status: 200,
    message: "story started",
  });
});

exports.endStory = catchAsyncError(async (req, res, next) => {
  let { roomId } = req.params;
  const room = await storyRoomModel.findById(roomId);

  if (!room) {
    res.status(400).json({ message: "Story not found" });
  }

  if (room.admin != req.userId) {
    res.status(403).json({ message: "You do not have access" });
  }

  if (room.status === "upcoming" || room.status === "completed") {
    res.status(401).json({ message: "Story not started yet/completed" });
  }

  room.status = "completed";
  await room.save();

  res.status(200).json({
    status: 200,
    message: "story completed",
  });
});
