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
const cluster = require("cluster");
const totalCpus = require("os").cpus();
cluster.schedulingPolicy = cluster.SCHED_RR;
const port = process.env.PORT;

// const server = require("http").Server(app);
// const io = require("socket.io")(server);
// const port = process.env.PORT;
// const users = {};
// const rooms = {};



// app.listen(port, () => console.log("server running on port:" + port));

if (cluster.isMaster) {
  totalCpus.forEach(async (node) => {
    await cluster.fork();
  });
  cluster.on("exit", async (worker, code, signal) => {
    await cluster.fork();
  });
} else {
  app.listen(5000, () => {
    console.log(`Process ${process.pid} is online on port number ${port}`);
  });
}
