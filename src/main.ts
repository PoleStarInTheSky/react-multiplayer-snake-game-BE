import express from "express";
import http from "http";
import { Server } from "socket.io";
import { freeID, makeID } from "./utils";
import { getUpdatedVelocity, initGame, gameLoop } from "./game";
import { FRAME_RATE } from "./config";

const app = express();
const server = http.createServer(app);
//配置 Sockt.io 并且允许跨域
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
});
//坐标类型
export interface Coord {
  x: number;
  y: number;
}
//玩家的游戏信息
interface Player {
  //蛇头坐标
  pos: Coord;
  //速度
  vel: Coord;
  snake: Coord[];
}
//一个房间的信息
export interface RoomState {
  players: Player[];
  food: Coord;
}
//记录不同房间的玩家信息
export interface State {
  [key: string]: RoomState | null;
}
// 由客户id到房间id的map
const clientRooms: Map<string, string> = new Map();
// map记录是第几号玩家
const clientNumbers: Map<string, number> = new Map();
//记录全局游戏信息
const state: State = {};

//客户端链接后绑定相应函数
io.on("connection", (client) => {
  console.log(client);
  // client.on("trial", handleTrial);
  client.on("keydown", handleKeydown);
  client.on("newGame", handleNewGame);
  client.on("joinGame", handleJoinGame);

  // function handleTrial() {}
  function handleJoinGame(roomName: string) {
    // 通过房间号获取房间
    const room = io.sockets.adapter.rooms.get(roomName);
    console.log(room);
    let numClients = 0;
    if (room) {
      //获取房间客户端的数目
      numClients = room.size;
    }

    //用户数刚好是1才能加入
    if (numClients === 0) {
      //表示这个游戏还没有被创建，是一个无用的代号
      client.emit("unknownCode");
      return;
    } else if (numClients > 1) {
      //只支持双人对战
      client.emit("tooManyPlayers");
      return;
    }

    // 设置客户id对应的房间号
    clientRooms.set(client.id, roomName);

    //客户加入该房间
    client.join(roomName);
    //设置客户对应的玩家号
    clientNumbers.set(client.id, 2);
    client.emit("init", 2);

    startGameInterval(roomName);
  }

  function handleNewGame() {
    // 生成6位数房间号
    const roomName = makeID(6);
    clientRooms.set(client.id, roomName);
    client.emit("gameCode", roomName);

    //保存当前房间的状态
    //一开始的游戏布局从点击新游戏的时候就生成了
    state[roomName] = initGame();

    client.join(roomName);
    clientNumbers.set(client.id, 1);
    client.emit("init", 1);
  }

  //处理用户传来的按键事件
  function handleKeydown(keyCode: string) {
    //用客户的id作为索引，获得房间名
    const roomName = clientRooms.get(client.id);
    if (!roomName) {
      return;
    }

    const keyCodeNum = parseInt(keyCode);
    //获得点按按键后获得的速度对象
    const vel = getUpdatedVelocity(keyCodeNum);

    const clientNumber = clientNumbers.get(client.id);
    //TODO 修复游戏结束后点击出现的BUG
    if (vel) {
      const lastVel = (state[roomName] as RoomState).players[
        (clientNumber as number) - 1
      ].vel;
      //不允许用户按下与当前速度相反的键
      if (lastVel.x + vel.x !== 0 || lastVel.y + vel.y !== 0) {
        (state[roomName] as RoomState).players[
          (clientNumber as number) - 1
        ].vel = vel;
      }
    }
  }
});

function startGameInterval(roomName: string) {
  const intervalId = setInterval(() => {
    //gameLoop 中执行每次程序运行的逻辑

    const winner = gameLoop(state[roomName] as RoomState);

    if (!winner) {
      emitGameState(roomName, state[roomName] as RoomState);
    } else {
      emitGameOver(roomName, winner as number);
      // 游戏结束，去除这一房间的信息
      delete state[roomName];
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(roomName: string, roomState: RoomState) {
  //持续给房间里所有人发信息
  io.sockets.in(roomName).emit("gameState", JSON.stringify(roomState));
}

function emitGameOver(roomName: string, winner: number) {
  //给胜利者发信息
  io.sockets.in(roomName).emit("gameOver", JSON.stringify({ winner }));
  //解放相应的ID
  freeID(roomName);
}

// 服务器开始监听
server.listen(4001, () => {
  console.log("Listening on 4001");
});
