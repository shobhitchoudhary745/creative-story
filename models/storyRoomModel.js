const mongoose = require("mongoose");

const storyRoomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      unique: true,
      required: [true, "Please Enter RoomName"],
    },
    theme: {
      type: String,
      required: [true, "Please Enter Theme"],
    },
    description: {
      type: String,
      required: [true, "Please Enter Description"],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    participants: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        invitationAccepted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    genreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genres",
    },
    acceptedInvitation: [
      {
        type: String,
        ref: "User",
      },
    ],
    numberOfRounds: {
      type: Number,
      required: [true, "Please Enter NumberOfRounds"],
    },
    status: {
      type: String,
      default: "upcoming",
    },
    chats: [
      {
        reactions: [
          {
            type: {
              type: String,
            },
            count: {
              type: Number,
              default: 0,
            },
            user: { type: [{ type: mongoose.Schema.Types.ObjectId }] },
          },
        ],
        reaction_list: [{ type: mongoose.Schema.Types.ObjectId }],

        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        firstMessage: { type: String },
        secondMessage: { type: String },
      },
    ],
    currentTurn: {
      type: Number,
      default: 0,
    },
    currentRound: {
      type: Number,
      default: 0,
    },
    currentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoryRoom", storyRoomSchema);
