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
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Updates", notificationsSchema);
