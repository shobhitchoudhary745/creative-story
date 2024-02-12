const app = require("./app");
const connectDatabase = require("./config/database");
connectDatabase();

// import serverKey from "../serverUtills/dv91e6f-firebase-adminsdk-8mq6c-31b929065d.json" assert { type: "json" };
// let fcm = new FCM(serverKey);

// fcm.send(message, function (err, response) {
//   if (err) {
//     return res.status(404).send({ error: { message: "Something went wrong" } });
//   } else {
//     return res.status(200).send({ data: { message: "Sent" } });
//   }
// });
// const cluster = require("cluster");
// const totalCpus = require("os").cpus();
// cluster.schedulingPolicy = cluster.SCHED_RR;
// const port = process.env.PORT;

const server = require("http").Server(app);
const io = require("socket.io")(server);
const port = process.env.PORT;
const users = {};
const rooms = {};

io.on("connection", (socket) => {
  socket.on("login", async ({ id }) => {
    // console.log(User Id after login ===>>>${id})
    try {
      socket.join(id); //personal message
      io.to(id).emit("loginSuccessfully", { message: "Welcome User", id });
      users[socket.id] = id;
      console.log(users);
    } catch (err) {
      console.log(err);
      io.to(socket.id).emit("error", err);
    }
  });

  socket.on("createStory", async (data) => {
    rooms[socket.id] = [];
    rooms[socket.id].push(data["roomId"]);
    socket.join(data["roomId"]);
    console.log(data["hostname"]);
    console.log("user created room id: ", data["roomId"]);
    try {
      for (let user of data["participants"]) {
        io.to(user["_id"]).emit("storyInvitation", { data });
      }
    } catch (error) {}
  });

  socket.on("joinRoom", async (data) => {
    try {
      for (let room of data["rooms"]) {
        console.log(room);
        socket.join(room);
      }
    } catch (error) {}
  });

  socket.on("addParticipants", async (data) => {
    try {
      for (let user of data["participants"]) {
        io.to(user["_id"]).emit("storyInvitation", { data });
      }
    } catch (error) {}
  });

  socket.on("removeParticipants", async (data) => {
    try {
      io.to(data["participant"]).emit("removeInvitation", { data });
    } catch (error) {}
  });

  socket.on("acceptInvitation", async (data) => {
    const roomId = data["roomId"];
    console.log("user acceptInvitation room id: ", data["roomId"]);
    socket.join(data["roomId"]);
    try {
      console.log(io.sockets.adapter.rooms.has(roomId));
      io.to(data["roomId"]).emit("invitationAccepted", { roomId });
    } catch (error) {
      console.log("error in invitaion accept emit: ", error);
    }
  });

  socket.on("rejectInvitation", async (data) => {
    const roomId = data["roomId"];
    console.log("user rejectInvitation room id: ", data["roomId"]);
    try {
      io.to(data["roomId"]).emit("invitationRejected", { roomId });
    } catch (error) {
      io.to(socket.id).emit("error", err);
    }
  });

  socket.on("startStory", async (data) => {
    const roomId = data["roomId"];
    try {
      io.to(data["roomId"]).emit("storyStarted", { roomId });
    } catch (error) {}
  });

  socket.on("sendMessage", async (data) => {
    console.log("user send a messge in room: ", data["roomId"]);
    const roomId = data["roomId"];
    try {
      io.to(roomId).emit("messageSend", { roomId });
    } catch (error) {}
  });

  socket.on("escapeTurn", async (data) => {
    const roomId = data["roomId"];
    try {
      io.to(roomId).emit("turnIsEscaped", { roomId });
    } catch (error) {}
  });
});

server.listen(port, () => console.log("server running on port:" + port));

// if (cluster.isMaster) {
//   totalCpus.forEach(async (node) => {
//     await cluster.fork();
//   });
//   cluster.on("exit", async (worker, code, signal) => {
//     await cluster.fork();
//   });
// } else {
//   app.listen(5000, () => {
//     console.log(`Process ${process.pid} is online on port number ${port}`);
//   });
// }
