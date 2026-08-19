// Tuning values. Court units again map 1:1 to canvas pixels in the shell.
// Breakout stands the Pong court upright: the paddle slides along the
// BOTTOM, three walls bounce, and the fourth side — the pit — is open.

export const COURT = { width: 480, height: 560 };

export const DT = 1 / 120; // same 120Hz fixed timestep as Pong

// y is the paddle's fixed center line; only x changes. width lives in
// state (it's a setting), this is just the default.
export const PADDLE = { width: 70, height: 12, speed: 420, y: 520 };

export const BALL = {
  size: 10,
  serveSpeed: 300,
  serveMaxAngle: Math.PI / 6, // launches within ±30° of straight up
  speedUp: 1.03, // per paddle hit — the rally clock ticks on YOUR touches
  maxSpeed: 560,
  maxBounceAngle: Math.PI / 3, // paddle-edge hit sends it out at 60°
};

// The wall: 8 × 6 bricks starting `top` units below the ceiling, leaving
// room for the ball to loop behind the wall — the classic breakthrough.
export const BRICKS = { cols: 8, rows: 6, width: 60, height: 20, top: 60 };

export const LIVES = 3;
