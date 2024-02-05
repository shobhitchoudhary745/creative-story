const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    bannerUrl: {
      type: String,
    },
    clientName: {
      type: String,
    },
    navigationUrl:{
        type:String
    }
  },

  { timestamps: true }
);

module.exports = mongoose.model("Banners", bannerSchema);
