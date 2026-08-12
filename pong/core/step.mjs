// One tick of Pong physics.
//
// Snake's step() consumed a QUEUE of taps; Pong takes the input's CURRENT
// state each tick ({ left: -1|0|1, right: -1|0|1 }) because paddles respond
// to keys being HELD, not pressed. Two different input models for two
// different kinds of motion.

import { DT, PADDLE, BALL } from "./constants.mjs";
import { serve } from "./state.mjs";

function movePaddle(state, side, dir) {
  // Input is ANALOG: any value in [-1, 1], like a joystick axis. Keys
  // produce full pushes (±1); the AI pushes gently on easy difficulty.
  // The clamp means no input source can exceed the paddle's top speed.
  const push = Math.max(-1, Math.min(1, dir));
  if (!push) return;
  const p = state.paddles[side];
  const half = PADDLE.height / 2;
  // Move, then clamp so the paddle's edge never leaves the court. y is the
  // paddle CENTER, hence the half-height margins on both sides.
  p.y = Math.min(
    state.height - half,
    Math.max(half, p.y + push * PADDLE.speed * DT)
  );
}

function bounceOffPaddle(state, side) {
  const ball = state.ball;

  // Only a ball flying TOWARD this paddle can hit it — otherwise a ball
  // just deflected would re-collide on the very next tick.
  const movingToward = side === "left" ? ball.vx < 0 : ball.vx > 0;
  if (!movingToward) return false;

  const half = BALL.size / 2;
  // The paddle face the ball can touch: the side facing center court.
  const faceX =
    side === "left"
      ? PADDLE.margin + PADDLE.width
      : state.width - PADDLE.margin - PADDLE.width;
  const ballEdge = side === "left" ? ball.x - half : ball.x + half;

  const reached = side === "left" ? ballEdge <= faceX : ballEdge >= faceX;
  // A ball already BEHIND the paddle (a missed shot on its way out) must
  // not bounce off the paddle's back.
  const behind =
    side === "left"
      ? ballEdge < faceX - PADDLE.width
      : ballEdge > faceX + PADDLE.width;
  if (!reached || behind) return false;

  const paddle = state.paddles[side];
  // Where on the paddle did the ball land? -1 = top edge, 0 = dead center,
  // +1 = bottom edge. This one number IS Pong's skill element.
  const offset = (ball.y - paddle.y) / (PADDLE.height / 2 + half);
  if (Math.abs(offset) > 1) return false; // missed — sails past

  // The paddle doesn't "reflect" the ball like a mirror. It RE-AIMS it:
  // the outgoing angle depends only on where the paddle was struck, which
  // is what lets a player aim shots. Speed grows each hit, capped.
  const speed = Math.min(
    BALL.maxSpeed,
    Math.hypot(ball.vx, ball.vy) * BALL.speedUp
  );
  const angle = offset * BALL.maxBounceAngle;
  const dir = side === "left" ? 1 : -1;
  ball.vx = Math.cos(angle) * speed * dir;
  ball.vy = Math.sin(angle) * speed;
  // Push the ball flush with the face so it can't be inside the paddle.
  ball.x = side === "left" ? faceX + half : faceX - half;
  return true;
}

function score(state, winner) {
  state.scores[winner] += 1;
  if (state.scores[winner] >= state.winScore) {
    state.status = "gameover";
  } else {
    // The player who conceded receives the next serve.
    state.ball = serve(state, winner === "left" ? "right" : "left");
  }
}

// Advance the simulation by exactly one tick (DT seconds).
// Returns "moved" | "wall" | "paddle" | "scored" | null — events the shell
// can turn into sounds and flashes without knowing any rules.
export function step(state, input = {}) {
  if (state.status !== "playing") return null;

  movePaddle(state, "left", input.left ?? 0);
  movePaddle(state, "right", input.right ?? 0);

  const ball = state.ball;
  ball.x += ball.vx * DT;
  ball.y += ball.vy * DT;

  let event = "moved";

  // Top and bottom walls: a true mirror bounce — flip vy, and clamp the
  // ball back inside so it can't get stuck oscillating in the wall.
  const half = BALL.size / 2;
  if (ball.y - half < 0 && ball.vy < 0) {
    ball.y = half;
    ball.vy = -ball.vy;
    event = "wall";
  } else if (ball.y + half > state.height && ball.vy > 0) {
    ball.y = state.height - half;
    ball.vy = -ball.vy;
    event = "wall";
  }

  if (bounceOffPaddle(state, "left") || bounceOffPaddle(state, "right")) {
    event = "paddle";
  }

  // Past an end line entirely → the other side scores.
  if (ball.x + half < 0) {
    score(state, "right");
    return "scored";
  }
  if (ball.x - half > state.width) {
    score(state, "left");
    return "scored";
  }

  return event;
}
