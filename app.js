const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error");
const dotenv = require("dotenv");
const app = express();
const helmet = require("helmet");
const morgan = require("morgan");
dotenv.config({ path: "./config/config.env" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("tiny"));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  })
);

const userRoute = require("./routes/userRoutes");
const storyRoomRoute = require("./routes/storyRoomRoutes");
const adminRoute = require("./routes/adminRoutes");
const genreRoute = require("./routes/genreRoutes");
const notificationRoute = require("./routes/notificationsroutes");
const bannerRoutes = require("./routes/bannerRoutes");

app.use("/api/user", userRoute);
app.use("/api/story", storyRoomRoute);
app.use("/api/admin", adminRoute);
app.use("/api/genre", genreRoute);
app.use("/api/notification", notificationRoute);
app.use("/api/banner", bannerRoutes);

app.all("*", async (req, res) => {
  res
    .status(404)
    .json({
      error: {
        message: "Not Found. Kindly Check the API path as well as request type",
      },
    });
});
app.use(errorMiddleware);

module.exports = app;
