import { RoomState } from "./main";
import { GRID_SIZE } from "./config";
import { Coord } from "./main";
// 游戏业务逻辑在这里
export function initGame() {
  const roomroomState: RoomState = createRoomroomState();
  randomFood(roomroomState);
  return roomroomState;
}

function createRoomroomState() {
  return {
    players: [
      {
        //pos代表头部 蛇的头
        pos: {
          x: 3,
          y: 10,
        },
        vel: {
          x: 1,
          y: 0,
        },
        snake: [
          { x: 1, y: 10 },
          { x: 2, y: 10 },
          { x: 3, y: 10 },
        ],
      },
      {
        pos: {
          x: 18,
          y: 10,
        },
        vel: {
          x: 0,
          y: 0,
        },
        snake: [
          { x: 20, y: 10 },
          { x: 19, y: 10 },
          { x: 18, y: 10 },
        ],
      },
    ],
    food: { x: 1, y: 1 },
    gridsize: GRID_SIZE,
  };
}
function randomFood(roomState: RoomState): void {
  //随机生成食物点
  const food = {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };

  //不允许食物生成在蛇身上
  for (const player of roomState.players) {
    for (const cell of player.snake) {
      if (cell.x === food.x && cell.y === food.y) {
        return randomFood(roomState);
      }
    }
  }

  //如果能通过，设置好随机生成的食物点
  roomState.food = food;
}

//只处理按键事件
export function getUpdatedVelocity(keyCodeNum: number) {
  switch (keyCodeNum) {
    case 37: {
      // left
      return { x: -1, y: 0 };
    }
    case 38: {
      // down
      return { x: 0, y: -1 };
    }
    case 39: {
      // right
      return { x: 1, y: 0 };
    }
    case 40: {
      // up
      return { x: 0, y: 1 };
    }
  }
}

export function gameLoop(roomState: RoomState): boolean | number {
  const toAddsnakeCells = roomState.players.map((player) => player.snake);
  //保存了所有的蛇身体
  const snakeCells = toAddsnakeCells.flat();
  for (const player of roomState.players) {
    //计算坐标，到了边界从另外一边出来
    player.pos.x = (player.pos.x + player.vel.x + GRID_SIZE) % GRID_SIZE;
    player.pos.y = (player.pos.y + player.vel.y + GRID_SIZE) % GRID_SIZE;
    //玩家吃到食物
    if (
      roomState.food.x === player.pos.x &&
      roomState.food.y === player.pos.y
    ) {
      //把当前头部变成身体
      player.snake.push({ ...player.pos });
      //蛇变长
      player.pos.x = (player.pos.x + player.vel.x + GRID_SIZE) % GRID_SIZE;
      player.pos.y = (player.pos.y + player.vel.y + GRID_SIZE) % GRID_SIZE;
      //再生成食物
      randomFood(roomState);
    }
    if (player.vel.x || player.vel.y) {
      //如果吃到身体
      if (
        snakeCells.find(
          (cell) => cell.x == player.pos.x && cell.y === player.pos.y
        )
      )
        return 2;

      //身体变长
      player.snake.push({ ...player.pos });
      player.snake.shift();
    }
  }

  return false;
}
