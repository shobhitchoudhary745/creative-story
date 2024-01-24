const notificationsModel = require("../models/notificationsModel");
const storyRoomModel = require("../models/storyRoomModel");
const catchAsyncError = require("../utils/catchAsyncError");
const invitationsModel = require("../models/invitationModel");
const ErrorHandler = require("../utils/errorHandler");
const { sendInvitationEmail } = require("../utils/email");
// const genreModel = require("../models/genreModel");

exports.createRoom = catchAsyncError(async (req, res, next) => {
  const {
    roomName,
    theme,
    description,
    participants,
    numberOfRounds,
    userInvitations,
  } = req.body;

  let acceptedInvitation = [req.userId];

  const room = await storyRoomModel.create({
    roomName,
    theme,
    description,
    host: req.userId,
    participants,
    numberOfRounds,
    acceptedInvitation,
  });

  const notificationPromises = participants.map((userId) => {
    return notificationsModel.findOneAndUpdate(
      { owner: userId },
      { $push: { notifications: room._id } },
      { new: true }
    );
  });

  const updatedNotifications = await Promise.all(notificationPromises);
  // console.log(updatedNotifications);
  if (userInvitations.length > 0) {
    let userInvitations1 = userInvitations.map((email) => email.toLowerCase());
    const invitations = userInvitations1.map((email) => {
      return invitationsModel.create({ userEmail: email, room: room._id });
    });
    await Promise.all(invitations);
    const options = {
      email: userInvitations1,
      subject: "Invitation to join Creative story",
      html: `${req.user.userName} is Inviting You to join ${room.roomName}`,
    };
    await sendInvitationEmail(options);
  }
  // const genre = await genreModel.findOne({genre:theme});
  const populatedRoom = await storyRoomModel
    .findById(room._id)
    .populate("host", "userName profileUrl")
    .populate("participants._id", "userName profileUrl")
    .lean();

  delete populatedRoom.chats;
  // populatedRoom.colour = genre.colour;
  res.status(201).send({
    status: 201,
    success: true,
    data: populatedRoom,
    message: "room Created Successfully",
  });
});

exports.getRoomDetails = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;
  const roomDetails = await storyRoomModel
    .findById(roomId)
    .populate("host", "userName profileUrl")
    .populate("participants._id", "userName profileUrl")
    .lean();

  delete roomDetails.chats;
  // const genre = await genreModel.findOne({genre:roomDetails.genre});
  // roomDetails.colour = genre.colour
  res.status(200).send({
    status: 200,
    success: true,
    data: roomDetails,
    message: "room Details",
  });
});

exports.acceptInvitation = catchAsyncError(async (req, res, next) => {
  const { isAccept } = req.body;
  const roomDetails = await storyRoomModel.findById(req.params.roomId);
  if (roomDetails.status != "upcoming") {
    return next(new ErrorHandler("Story is ongoing or completed", 400));
  }
  const notification = await notificationsModel.findOneAndUpdate(
    { owner: req.userId },
    { $pull: { notifications: roomDetails._id } },
    { new: true }
  );

  roomDetails.participants.map((data) => {
    if (data._id == req.userId) {
      data.invitationAccepted = isAccept;
    }
  });
  if (isAccept) {
    roomDetails.acceptedInvitation.push(req.userId);
  }
  await roomDetails.save();
  delete roomDetails.chats;
  res.status(202).send({
    status: 202,
    success: true,
    data: roomDetails,
    message: isAccept
      ? `Invitation Accepted Successfully`
      : `Invitation Rejected Successfully`,
  });
});

exports.getMyStories = catchAsyncError(async (req, res, next) => {
  let userId = req.userId;
  // console.log(userId);
  const rooms = await storyRoomModel
    .find()
    .populate("participants._id", "userName profileUrl")
    .lean();
  const arr = [];
  // const admin = rooms.filter(data=>data.adminId==userId);
  for (let data of rooms) {
    delete data.chats;
    console.log(userId);
    if (data.host == userId) {
      data.host = true;
      arr.push(data);
      continue;
    }
    for (let participant of data.participants) {
      if (participant._id == userId && participant.invitationAccepted) {
        data.host = false;
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
  const rooms = await storyRoomModel
    .find({
      $and: [
        {
          $or: [
            { host: userId },
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
    })
    .populate("participants._id", "userName profileUrl")
    .lean();
  for (let data of rooms) {
    delete data.chats;
    if (data.host == userId) {
      data.host = true;
    } else {
      data.host = false;
    }
  }

  res.status(200).send({
    status: 200,
    length: rooms.length,
    active_stories: rooms,
  });
});

exports.getUpcomingStories = catchAsyncError(async (req, res, next) => {
  let userId = req.userId;
  const rooms = await storyRoomModel
    .find({
      $and: [
        {
          $or: [
            { host: userId },
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
    })
    .populate("participants._id", "userName profileUrl")
    .lean();
  for (let data of rooms) {
    delete data.chats;
    if (data.host == userId) {
      data.host = true;
    } else {
      data.host = false;
    }
  }

  res.status(200).send({
    status: 200,
    length: rooms.length,
    upcoming_stories: rooms,
  });
});

exports.getCompletedStories = catchAsyncError(async (req, res, next) => {
  let userId = req.userId;
  const rooms = await storyRoomModel
    .find({
      $and: [
        {
          $or: [
            { host: userId },
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
    })
    .populate("participants._id", "userName profileUrl")
    .lean();

  for (let data of rooms) {
    delete data.chats;
    if (data.host == userId) {
      data.host = true;
    } else {
      data.host = false;
    }
  }

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
  console.log(room.host, " ", req.userId);
  if (room.host != req.userId) {
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

  if (room.host != req.userId) {
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

exports.createChat = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;
  const room = await storyRoomModel.findById(req.params.roomId);
  if (!room) {
    return next(new ErrorHandler("Room Not Found", 404));
  }
  // console.log(room)
  if (room.status === "active") {
    room.chats.push({
      sender: {
        senderId: req.userId,
        senderName: req.user.userName,
        senderProfileUrl: req.user.profileUrl,
      },
      message,
    });
    await room.save();
  } else {
    res.status(400).json({
      success: false,
      message: "Story telling is not yet Started or Completed",
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "Chat saved Succesfully",
  });
});

exports.getChat = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;
  const room = await storyRoomModel.findById(roomId);
  if (!room) {
    return next(new ErrorHandler("Room Not Found", 404));
  }

  res.status(200).json({
    status: 200,
    message: "Chat found",
    success: true,
    chats: room.chats,
  });
});

exports.addParticipants = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;
  const { participants } = req.body;
  const room = await storyRoomModel.findById(roomId);
  if (!room) {
    return next(new ErrorHandler("Room Not Found", 404));
  }

  if (req.userId != room.host) {
    return next(new ErrorHandler("you did not have authority", 401));
  }

  room.participants = [...room.participants, ...participants];
  await room.save();
  const notificationPromises = participants.map((userId) => {
    return notificationsModel.findOneAndUpdate(
      { owner: userId },
      { $push: { notifications: room._id } },
      { new: true }
    );
  });

  const updatedNotifications = await Promise.all(notificationPromises);

  res.status(200).json({
    status: 200,
    message: "Participants added successfully",
    success: true,
    room,
  });
});

exports.removeParticipant = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;
  const { participant } = req.body;
  const room = await storyRoomModel.findById(roomId);
  if (!room) {
    return next(new ErrorHandler("Room Not Found", 404));
  }

  if (req.userId != room.host) {
    return next(new ErrorHandler("you did not have authority", 401));
  }

  room.participants = room.participants.filter((data) => data != participant);
  await room.save();

  const notification = await notificationsModel.findOneAndUpdate(
    { owner: participant },
    { $pull: { notifications: room._id } },
    { new: true }
  );

  res.status(200).json({
    status: 200,
    message: "Participants removed successfully",
    success: true,
    room,
  });
});
