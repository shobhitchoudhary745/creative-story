const mongoose = require("mongoose");

const invitationsSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoryRoom",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitations", invitationsSchema);
