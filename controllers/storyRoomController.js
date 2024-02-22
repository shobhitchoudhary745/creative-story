const notificationsModel = require("../models/notificationsModel");
const storyRoomModel = require("../models/storyRoomModel");
const catchAsyncError = require("../utils/catchAsyncError");
const invitationsModel = require("../models/invitationModel");
const userModel = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const { sendInvitationEmail } = require("../utils/email");

const { firebase } = require("../utils/firebase");
const updateModel = require("../models/updateModel");
const messaging = firebase.messaging();
// const genreModel = require("../models/genreModel");

exports.sendDummyToken = catchAsyncError(async (req, res, next) => {
  // const { firebaseToken } = req.body;
  // const message = {
  //   notification: {
  //     title: "Hello from FCM!",
  //     body: "This is a test message from FCM.",
  //   },
  //   token:
  //     "dtiXgoPjQkqouyIocbOZCj:APA91bH-ND3JFseNovkDlEdExO_DbmNoEEG-fRG1mlpDdrpI77soYk_oDOVJByL-PoJUDnq_Om6YkW1vqvwr5h8oulqd_yBHL59pob38sxY2BZv-23YONJmYP-Jw5DG-u_0UoRhbs9tr",
  // };
  // messaging
  //   .send(message)
  //   .then((response) => {
  //     res.status(200).send(response);
  //   })
  //   .catch((error) => {
  //     res.status(400).send(error);
  //   });
});

exports.createRoom = catchAsyncError(async (req, res, next) => {
  const {
    roomName,
    theme,
    description,
    participants,
    numberOfRounds,
    userInvitations,
    genreId,
  } = req.body;

  participants[0].invitationAccepted = true;

  let acceptedInvitation = [req.userId];

  const room = await storyRoomModel.create({
    roomName,
    theme,
    description,
    host: req.userId,
    participants,
    numberOfRounds,
    acceptedInvitation,
    genreId,
  });

  // console.log(updatedNotifications);

  // const genre = await genreModel.findOne({genre:theme});
  const populatedRoom = await storyRoomModel
    .findById(room._id)
    .populate("host", "userName profileUrl")
    .populate("genreId", "colour backgroundColour imageUrl")
    .populate("participants._id", "userName profileUrl")
    .lean();

  delete populatedRoom.chats;
  // console.log(fcmTokenArray);

  res.status(201).send({
    status: 201,
    success: true,
    data: populatedRoom,
    message: "room Created Successfully",
  });

  const notificationPromises = participants.slice(1).map((userId) => {
    return notificationsModel.findOneAndUpdate(
      { owner: userId },
      { $push: { notifications: room._id } },
      { new: true }
    );
  });

  const invitations = participants.slice(1).map((userId) => {
    return userModel.findById(userId);
  });

  const users = await Promise.all(invitations);
  const fcmTokenArray = [];
  for (let user of users) {
    if (user.fireBaseToken) fcmTokenArray.push(user.fireBaseToken);
  }

  const updatedNotifications = await Promise.all(notificationPromises);

  if (userInvitations.length > 0) {
    // let userInvitations1 = userInvitations.map((email) => email.toLowerCase());
    let userInvitations1 = [];
    for (let user of userInvitations) {
      if (user.trim()) {
        userInvitations1.push(user.toLowerCase());
      }
    }
    const invitations = userInvitations1.map((email) => {
      return invitationsModel.create({ userEmail: email, room: room._id });
    });
    await Promise.all(invitations);
    const options = {
      email: userInvitations1,
      subject: "Invitation to join Creative story",
      html: `<div style="font-family: 'Arial', sans-serif; text-align: center; background-color: #f4f4f4; margin-top: 15px; padding: 0;">

      <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333333;">Invitation</h1>
        <p style="color: #666666;">${req.user.userName} is Inviting You to join ${room.roomName}</p>
        <p style="font-size: 24px; font-weight: bold; color: #009688; margin: 0;">Join the adventure now</p>
        <p style="color: #666666;">Use this code to Forgot your Password</p>
      </div>
  
      <div style="color: #888888;">
        <p style="margin-bottom: 10px;">Regards, <span style="color: #caa257;">Team String Geo</span></p>
      </div>
    
    </div>`,
    };
    await sendInvitationEmail(options);
  }

  if (fcmTokenArray.length) {
    for (let token of fcmTokenArray) {
      const message = {
        notification: {
          title: "Story Room Invitation",
          body: "You've been invited to join a story room! Accept or decline now.",
        },
        token,
        data: {
          type: "request",
        },
      };
      await messaging.send(message);
    }

    // await Promise.all(promise);
  }
});

exports.getRoomDetails = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;
  const roomDetails = await storyRoomModel
    .findById(roomId)
    .populate("host", "userName profileUrl")
    .populate("genreId", "colour backgroundColour imageUrl")
    .populate("participants._id", "userName profileUrl")
    .populate("currentUser", "userName profileUrl")
    .lean();

  delete roomDetails.chats;

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
  if (!roomDetails) {
    await notificationsModel.findOneAndUpdate(
      { owner: req.userId },
      { $pull: { notifications: roomDetails._id } },
      { new: true }
    );
    return next(new ErrorHandler("Room not found", 400));
  }
  if (roomDetails.status != "upcoming") {
    return next(new ErrorHandler("Story is ongoing or completed", 400));
  }
  const notification = await notificationsModel.findOneAndUpdate(
    { owner: req.userId },
    { $pull: { notifications: roomDetails._id } },
    { new: true }
  );

  let check = false;
  let temp = [];
  for (let data of roomDetails.participants) {
    if (data._id != req.userId) {
      temp.push(data);
    } else {
      check = true;
      if (isAccept) {
        data.invitationAccepted = true;
        temp.push(data);
      }
    }
  }
  if (!check) {
    if (isAccept) {
      temp.push({ _id: req.userId, invitationAccepted: isAccept });
    }
  }

  roomDetails.participants = temp;

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
  const rooms = await storyRoomModel
    .find({
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
    })
    .populate("genreId", "colour backgroundColour imageUrl")
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
    my_stories: rooms,
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
    .populate("genreId", "colour backgroundColour imageUrl")
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
    .populate("genreId", "colour backgroundColour imageUrl")
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
    .populate("genreId", "colour backgroundColour imageUrl")
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
  // console.log(room.host, " ", req.userId);
  if (room.host != req.userId) {
    res.status(403).json({ message: "You do not have access" });
  }

  if (room.status === "completed" || room.status === "active") {
    res.status(401).json({ message: "Story already completed/ongoing" });
  }

  await invitationsModel.deleteMany({ room: roomId });

  room.status = "active";
  room.currentTurn = 1;
  room.currentRound = 1;
  room.currentUser = room.acceptedInvitation[0];
  let temp = [];
  for (let data of room.participants) {
    if (data.invitationAccepted) {
      temp.push(data);
    } else {
      await notificationsModel.findOneAndUpdate(
        { owner: data._id },
        { $pull: { notifications: room._id } }
      );
    }
  }
  room.participants = temp;
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
  const promise = room.participants.slice(1).map((userId) => {
    return userModel.findById(userId);
  });

  const promise2 = room.participants.slice(1).map((userId) => {
    return updateModel.findOneAndUpdate(
      { owner: userId },
      {
        $push: {
          updates: {
            type: "Story Card is Ready",
            data: room._id,
            roomName: room.roomName,
            createdAt: new Date(),
          },
        },
        $inc: { count: 1 },
      }
    );
  });

  await room.save();
  await Promise.all(promise2);

  const users = await Promise.all(promise);
  const tokenArray = [];
  for (let user of users) {
    if (user.fireBaseToken) {
      tokenArray.push(user.fireBaseToken);
    }
  }

  res.status(200).json({
    status: 200,
    message: "story completed",
  });

  if (tokenArray.length) {
    if (tokenArray.length) {
      for (let token of tokenArray) {
        const message = {
          notification: {
            title: "Game End",
            body: "The story game has ended. Check out the completed story card!",
          },
          token,
          data: {
            type: "card",
            room: JSON.stringify(room),
          },
        };
        await messaging.send(message);
      }
    }
  }
});

exports.createChat = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;
  const room = await storyRoomModel.findById(req.params.roomId);
  if (!room) {
    return next(new ErrorHandler("Room Not Found", 404));
  }
  // console.log(room)
  if (room.status === "active") {
    if (room.chats.length == 0) {
      room.chats.push({
        sender: {
          senderId: req.userId,
          senderName: req.user.userName,
          senderProfileUrl: req.user.profileUrl,
        },
        firstMessage: message,
        secondMessage: "",
      });
    } else if (
      room.chats[room.chats.length - 1].secondMessage ||
      room.chats[room.chats.length - 1].secondMessage == null
    ) {
      room.chats.push({
        sender: {
          senderId: req.userId,
          senderName: req.user.userName,
          senderProfileUrl: req.user.profileUrl,
        },
        firstMessage: message,
        secondMessage: "",
      });
    } else {
      room.chats[room.chats.length - 1].secondMessage = message;
    }

    if (room.chats[room.chats.length - 1].secondMessage) {
      if (room.currentTurn == room.acceptedInvitation.length) {
        room.currentTurn = 1;
        room.currentUser = room.acceptedInvitation[room.currentTurn - 1];
        // room.currentRound < room.numberOfRounds ? (room.currentRound += 1) : "";
        room.currentRound += 1;
      } else {
        room.currentTurn += 1;
        room.currentUser = room.acceptedInvitation[room.currentTurn - 1];
      }
      // const user = await userModel.findById(room.currentUser);
    }
    await room.save();
  } else {
    return res.status(400).json({
      success: false,
      message: "Story telling is not yet Started or Completed",
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "Chat saved Succesfully",
  });

  const update = await updateModel.findOne({ owner: room.currentUser });
  update.updates.push({
    type: "Game Start, Its Your turn",
    data: room._id,
    roomName: room.roomName,
    createdAt: new Date(),
  });
  update.count += 1;
  await update.save();

  if (user.fireBaseToken) {
    const message = {
      notification: {
        title: "Game Start",
        body: "The story room has started! It's your turn to contribute.",
      },
      token: user.fireBaseToken,
      data: {
        type: "chat",
        room: JSON.stringify(room),
      },
    };
    await messaging.send(message);
  }
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

exports.escapeSequence = catchAsyncError(async (req, res, next) => {
  const room = await storyRoomModel.findById(req.params.roomId);
  if (!room) {
    return next(new ErrorHandler("Room Not Found", 404));
  }

  const userId = room.currentUser;
  if (room.status === "active" && room.host == req.userId) {
    
    if (room.currentTurn == room.participants.length) {
      room.currentTurn = 1;
      room.currentUser = room.acceptedInvitation[room.currentTurn - 1];
      // if (room.currentRound < room.numberOfRounds) {
      room.currentRound += 1;
      // }
    } else {
      room.currentTurn += 1;
      room.currentUser = room.acceptedInvitation[room.currentTurn - 1];
    }
    if (
      room.chats[room.chats.length - 1].secondMessage ||
      room.chats[room.chats.length - 1].secondMessage == null
    ) {
      room.chats.push({ firstMessaage: null, secondMessage: null });
    } else {
      room.chats[room.chats.length - 1].secondMessage = null;
    }
    await room.save();
    // const user = await userModel.findById(userId);
  } else {
    return res.status(400).json({
      success: false,
      message: "You do not have Access",
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "Sequence Escaped Succesfully",
  });
  const update = await updateModel.findOne({ owner: userId });
  update.updates.push({
    type: "skipped",
    data: room._id,
    roomName: room.roomName,
    createdAt: new Date(),
  });
  update.count += 1;
  await update.save();
  if (user.fireBaseToken) {
    const message = {
      notification: {
        title: "Participant Skipped",
        body: "You've been skipped! It's okay, catch the next turn.",
      },
      token: user.fireBaseToken,
      data: {
        type: "chat",
        room: JSON.stringify(room),
      },
    };
    await messaging.send(message);
  }
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

  console.log(participants);

  room.participants = [...room.participants, ...participants];
  await room.save();
  const promise = participants.map((userId) => {
    return userModel.findById(userId);
  });
  const users = Promise.all(promise);
  const fcmTokenArray = [];
  for (let user of users) {
    if (user.fireBaseToken) {
      fcmTokenArray.push(user.fireBaseToken);
    }
  }

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
  if (fcmTokenArray.length) {
    for (let token of fcmTokenArray) {
      const message = {
        notification: {
          title: "Story Room Invitation",
          body: "You've been invited to join a story room! Accept or decline now.",
        },
        token,
        data: {
          type: "request",
        },
      };
      await messaging.send(message);
    }

    // await Promise.all(promise);
  }
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

  room.participants = room.participants.filter(
    (data) => data._id != participant
  );
  room.acceptedInvitation = room.acceptedInvitation.filter(
    (data) => data != participant
  );
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

exports.getGameDetails = catchAsyncError(async (req, res, next) => {
  const { roomId } = req.params;
  const roomDetails = await storyRoomModel
    .findById(roomId)
    .populate("host", "userName profileUrl")
    .populate("genreId", "colour backgroundColour imageUrl")
    .populate("participants._id", "userName profileUrl")
    .populate("currentUser", "userName profileUrl")
    .lean();

  res.status(200).send({
    status: 200,
    success: true,
    data: roomDetails,
    message: "room Details",
  });
});
