// The shape of the world: paddle, ball, and the wall of bricks.

import { COURT, PADDLE, BALL, BRICKS, LIVES } from "./constants.mjs";

// Bricks live in a flat array of {x, y, row, points} — destroyed bricks are
// simply removed, so "how many are left" and "is the level clear" are just
// array length. 48 bricks is small enough that scanning the whole array
// per tick costs nothing.
export function createBricks() {
  const bricks = [];
  for (let row = 0; row < BRICKS.rows; row++) {
    for (let col = 0; col < BRICKS.cols; col++) {
      bricks.push({
        x: col * BRICKS.width,
        y: BRICKS.top + row * BRICKS.height,
        row,
        // Rows near the ceiling pay more — the reward for breaking through.
        points: BRICKS.rows - row,
      });
    }
  }
  return bricks;
}

// A fresh ball sits GLUED to the paddle, motionless — the serving state.
// Velocity arrives later, from launch() (see core/step.mjs).
export function placeBall(state) {
  return {
    x: state.paddle.x,
    y: PADDLE.y - PADDLE.height / 2 - BALL.size / 2,
    vx: 0,
    vy: 0,
  };
}

export function createState({
  random = Math.random,
  lives = LIVES,
  paddleWidth = PADDLE.width, // a setting → a parameter, as always
} = {}) {
  const state = {
    width: COURT.width,
    height: COURT.height,
    random,
    paddle: { x: COURT.width / 2, width: paddleWidth },
    ball: null,
    bricks: createBricks(),
    lives,
    score: 0,
    // The full graph lives in core/machine.mjs. A game begins waiting for
    // the player's launch, ball glued to the paddle.
    status: "serving",
    tick: 0, // world time: +1 per simulated step (replays anchor to it)
  };
  state.ball = placeBall(state);
  return state;
}
