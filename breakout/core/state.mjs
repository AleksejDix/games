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

// A fresh ball sits on the paddle and launches up at a random slight angle.
// Angles are measured from straight up, so sin gives the sideways share
// and -cos the upward share (canvas y grows downward).
export function serve(state) {
  const angle = (state.random() * 2 - 1) * BALL.serveMaxAngle;
  return {
    x: state.paddle.x,
    y: PADDLE.y - PADDLE.height / 2 - BALL.size / 2,
    vx: Math.sin(angle) * BALL.serveSpeed,
    vy: -Math.cos(angle) * BALL.serveSpeed,
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
    status: "playing", // "playing" | "cleared" | "gameover"
  };
  state.ball = serve(state);
  return state;
}
