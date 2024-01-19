const mongoose = require("mongoose");

const notificationsSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notifications: [
      {
        type:String,
        ref:"StoryRoom"
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notifications", notificationsSchema);
