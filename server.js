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


io.on("connection", socket => {
  console.log("a user connected");
  socket.on("joinRoom",async({roomId})=>{
    try{
    socket.join(roomId)
  }catch(err){
      console.log(err)
      io.to(socket.id).emit("error",err);
    }
  })

  socket.on("disconnect", async() => {something});
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
