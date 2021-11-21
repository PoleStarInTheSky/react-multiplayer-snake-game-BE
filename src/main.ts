import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

server.listen(4000, () => {
  console.log("Listening on 4000");
});
