const mongoose = require("mongoose");

const genreSchema = new mongoose.Schema(
  {
    genre: {
      type: String,
      required: true,
    },
    starter: [
      {
        starter: { type: String },
        description: { type: String },
      },
    ],
    colour: {
      type: String,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Genres", genreSchema);
