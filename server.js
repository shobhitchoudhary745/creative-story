const app = require("./app");
const connectDatabase = require("./config/database");
connectDatabase();
const cluster = require("cluster");
const totalCpus = require("os").cpus();
cluster.schedulingPolicy = cluster.SCHED_RR;
const port = process.env.PORT;


if (cluster.isMaster) {
  totalCpus.forEach(async (node) => {
    await cluster.fork();
  });
  cluster.on("exit", async (worker, code, signal) => {
    await cluster.fork();
  });
} else {
  app.listen(port, () => {
    console.log(`Process ${process.pid} is online on port number ${port}`);
  });
}
