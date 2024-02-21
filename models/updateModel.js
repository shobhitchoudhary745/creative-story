const mongoose = require("mongoose");

const notificationsSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updates: [
      {
        type: {
          type: String,
        },
        data: {
          type: String,
        },
        roomName: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Updates", notificationsSchema);
