const mongoose = require("mongoose");

const storyRoomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
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
    numberOfRounds:{
      type:String,
      required:[true,"Please Enter NumberOfRounds"]
    },
    status:{
      type:String,
      default:"upcoming"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoryRoom", storyRoomSchema);
