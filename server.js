const app = require("./app");
const connectDatabase = require("./config/database");
connectDatabase();
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
  io.emit("welcome", { data: "welcome Ansh from server" });
  console.log("socket id:", socket.id);

  socket.on("createStory", async (data) => {
    try {
      for (let user of data["participants"]) {
        io.to(user["_id"]).emit("storyInvitation", { data });
      }
    } catch (error) {}
  });

  socket.on("addParticipants", async (data) => {
    try {
      for (let user of data["participants"]) {
        io.to(user["_id"]).emit("addRequest", { data });
      }
    } catch (error) {}
  });

  socket.on("removeParticipants", async (data) => {
    try {
      io.to(data["participant"]).emit("removeInvitation", { data });
    } catch (error) {}
  });

  socket.on("joinRoom", async ({ roomId }) => {
    try {
      rooms[users[socket.id]] = [];
      rooms[users[socket.id]].push(roomId);
      socket.join(roomId);
    } catch (err) {
      console.log(err);
      io.to(socket.id).emit("error", err);
    }
  });
  socket.on("login", async ({ id }) => {
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

  socket.on("message", async ({ roomId, message, senderId }) => {
    try {
      io.to(roomId).emit("sendMessage", { message, senderId });
      // io.emit("welcome",{message:"hello Ansh from server"})
      console.log(roomId, message, senderId);
    } catch (error) {}
  });

  socket.on("disconnect", async ({ id }) => {
    console.log("user is disconnected: ", socket.id);
    // for(let i of rooms[users[socket.id]]){
    //   io.to(i).emit("user-left",{})
    // }
    // delete users[socket.id];
    // console.log(users);
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
