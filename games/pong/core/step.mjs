// One tick of Pong physics.
//
// Snake's step() consumed a QUEUE of taps; Pong takes the input's CURRENT
// state each tick ({ left: -1|0|1, right: -1|0|1 }) because paddles respond
// to keys being HELD, not pressed. Two different input models for two
// different kinds of motion.

import { DT, PADDLE, BALL } from "./constants.mjs";
import { serve } from "./state.mjs";
import { transition } from "./machine.mjs";
import {
  slidePaddle, crossedFace, catchOffset, rallySpeed, reaim,
} from "../../../shared/paddle.mjs";

function movePaddle(state, side, dir) {
  // y is the paddle CENTER, hence the half-height margins on both rails.
  const p = state.paddles[side];
  const half = PADDLE.height / 2;
  p.y = slidePaddle(p.y, dir, PADDLE.speed, DT, half, state.height - half);
}

// The catch, mapped onto Pong's axes: the travel axis is x (toward
// whichever face), the lateral axis is y. The mechanism — crossing,
// offset, rally, re-aim — lives in shared/paddle.mjs.
function bounceOffPaddle(state, side) {
  const ball = state.ball;

  // Only a ball flying TOWARD this paddle can hit it — otherwise a ball
  // just deflected would re-collide on the very next tick.
  const toward = side === "left" ? -1 : 1;
  if (ball.vx * toward <= 0) return false;

  const half = BALL.size / 2;
  // The paddle face the ball can touch: the side facing center court.
  const faceX =
    side === "left"
      ? PADDLE.margin + PADDLE.width
      : state.width - PADDLE.margin - PADDLE.width;
  const ballEdge = side === "left" ? ball.x - half : ball.x + half;
  if (!crossedFace(ballEdge, ballEdge - ball.vx * DT, faceX, toward)) return false;

  const paddle = state.paddles[side];
  const offset = catchOffset(ball.y, paddle.y, PADDLE.height / 2 + half);
  if (offset === null) return false; // missed — sails past

  const speed = rallySpeed(ball.vx, ball.vy, BALL.speedUp, BALL.maxSpeed);
  const { out, across } = reaim(offset, speed, BALL.maxBounceAngle);
  ball.vx = out * -toward; // away from the face, back toward center court
  ball.vy = across;
  // Push the ball flush with the face so it can't be inside the paddle.
  ball.x = side === "left" ? faceX + half : faceX - half;
  return true;
}

// A point lands: returns the events it produced. The winner of the MATCH
// travels as payload on the gameover event — the shell never has to
// re-derive it by comparing scores.
function score(state, by) {
  state.scores[by] += 1;
  const events = [{ type: "scored", by }];
  if (state.scores[by] >= state.winScore) {
    transition(state, "gameover");
    events.push({ type: "gameover", winner: by });
  } else {
    // The player who conceded receives the next serve.
    state.ball = serve(state, by === "left" ? "right" : "left");
  }
  return events;
}

// The first serve: releases the frozen opening ball. An action like any
// other — the shell wires it to Space, a tap, or a start button.
export function start(state) {
  if (state.status !== "ready") return [];
  transition(state, "playing");
  return [{ type: "started" }];
}

// Advance the simulation by exactly one tick (DT seconds).
// Returns EVENTS AS DATA: an array of { type, ...payload } objects — an
// empty array is an uneventful tick. The shell turns them into sounds and
// flashes without knowing any rules.
export function step(state, input = {}) {
  if (state.status !== "playing") return [];

  movePaddle(state, "left", input.left ?? 0);
  movePaddle(state, "right", input.right ?? 0);

  const ball = state.ball;
  ball.x += ball.vx * DT;
  ball.y += ball.vy * DT;

  const events = [];

  // Top and bottom walls: a true mirror bounce — flip vy, and clamp the
  // ball back inside so it can't get stuck oscillating in the wall.
  const half = BALL.size / 2;
  if (ball.y - half < 0 && ball.vy < 0) {
    ball.y = half;
    ball.vy = -ball.vy;
    events.push({ type: "wall" });
  } else if (ball.y + half > state.height && ball.vy > 0) {
    ball.y = state.height - half;
    ball.vy = -ball.vy;
    events.push({ type: "wall" });
  }

  if (bounceOffPaddle(state, "left")) events.push({ type: "paddle", side: "left" });
  if (bounceOffPaddle(state, "right")) events.push({ type: "paddle", side: "right" });

  // Past an end line entirely → the other side scores.
  if (ball.x + half < 0) return [...events, ...score(state, "right")];
  if (ball.x - half > state.width) return [...events, ...score(state, "left")];

  return events;
}
