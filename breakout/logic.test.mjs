// ============================================================================
// Tests for the Breakout core — written before the implementation.
//
// Breakout is Pong turned solo: the same continuous physics and paddle
// re-aiming, but the opponent is a WALL OF BRICKS. The new idea this game
// teaches is rectangle-vs-rectangle (AABB) collision with reflection on the
// axis of least penetration — plus lives and a win condition.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Breakout from "./logic.mjs";

function fakeRandom(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

// random() = 0.5 → serve angle 0 → the ball launches straight up from the
// paddle center (240, just above the paddle line).
function makeState() {
  return Breakout.createState({ random: fakeRandom(0.5) });
}

// --- setup ------------------------------------------------------------------

test("a new game has a full wall of bricks and full lives", () => {
  const state = makeState();

  assert.equal(state.bricks.length, Breakout.BRICKS.cols * Breakout.BRICKS.rows);
  assert.equal(state.lives, Breakout.LIVES);
  assert.equal(state.status, "playing");
});

test("higher brick rows are worth more points", () => {
  const state = makeState();
  const top = state.bricks.find((b) => b.row === 0);
  const bottom = state.bricks.find((b) => b.row === Breakout.BRICKS.rows - 1);

  assert.equal(top.points, Breakout.BRICKS.rows);
  assert.equal(bottom.points, 1);
});

test("createState accepts custom lives and paddle width", () => {
  const state = Breakout.createState({
    random: fakeRandom(0.5),
    lives: 5,
    paddleWidth: 100,
  });

  assert.equal(state.lives, 5);
  assert.equal(state.paddle.width, 100);
});

// --- motion -----------------------------------------------------------------

test("the ball travels by velocity × DT each tick", () => {
  const state = makeState();
  state.ball = { x: 240, y: 300, vx: 120, vy: 60 };

  Breakout.step(state);

  assert.equal(state.ball.x, 241);
  assert.equal(state.ball.y, 300.5);
});

test("the paddle slides horizontally and is clamped to the court", () => {
  const state = makeState();

  for (let i = 0; i < 200; i++) Breakout.step(state, -1);

  assert.equal(state.paddle.x, state.paddle.width / 2);
});

// --- walls (three of them — the bottom is open, that's the pit) --------------

test("the ball bounces off the side walls", () => {
  const state = makeState();
  state.ball = { x: 6, y: 300, vx: -300, vy: 60 };

  const event = Breakout.step(state);

  assert.equal(event, "wall");
  assert.ok(state.ball.vx > 0);
});

test("the ball bounces off the ceiling", () => {
  const state = makeState();
  state.ball = { x: 240, y: 6, vx: 60, vy: -300 };

  const event = Breakout.step(state);

  assert.equal(event, "wall");
  assert.ok(state.ball.vy > 0);
});

// --- the paddle -------------------------------------------------------------

test("the paddle re-aims the ball upward", () => {
  const state = makeState();
  state.paddle.x = 240;
  state.ball = { x: 240, y: 508, vx: 0, vy: 300 };

  const event = Breakout.step(state);

  assert.equal(event, "paddle");
  assert.ok(state.ball.vy < 0, "ball should head back up");
  assert.equal(state.ball.vx, 0, "center hit goes straight up");
});

test("an off-center paddle hit angles the ball", () => {
  const state = makeState();
  state.paddle.x = 240;
  state.ball = { x: 270, y: 508, vx: 0, vy: 300 }; // right half of the paddle

  Breakout.step(state);

  assert.ok(state.ball.vx > 0, "ball should angle right");
});

// --- bricks -----------------------------------------------------------------
// Tests hand-place bricks (same spirit as hand-placing Snake's food): a
// target plus one spare far away, so destroying the target doesn't clear
// the level by accident.

test("hitting a brick from below bounces the ball down and scores", () => {
  const state = makeState();
  const spare = { x: 0, y: 60, row: 0, points: 6 };
  state.bricks = [{ x: 200, y: 300, row: 2, points: 4 }, spare];
  state.ball = { x: 230, y: 327, vx: 0, vy: -300 };

  const event = Breakout.step(state);

  assert.equal(event, "brick");
  assert.ok(state.ball.vy > 0, "vertical hit flips vy");
  assert.deepEqual(state.bricks, [spare], "the brick is gone");
  assert.equal(state.score, 4);
});

test("hitting a brick from the side flips vx, not vy", () => {
  const state = makeState();
  state.bricks = [
    { x: 200, y: 300, row: 2, points: 4 },
    { x: 0, y: 60, row: 0, points: 6 },
  ];
  state.ball = { x: 196, y: 310, vx: 300, vy: 0 };

  Breakout.step(state);

  // The ball barely overlaps the brick's left edge but overlaps it deeply
  // in y — so the LEAST-penetration axis is x, and only vx reflects.
  assert.ok(state.ball.vx < 0, "horizontal hit flips vx");
  assert.equal(state.ball.vy, 0, "vy is untouched");
});

test("destroying the last brick wins the game", () => {
  const state = makeState();
  state.bricks = [{ x: 200, y: 300, row: 0, points: 6 }];
  state.ball = { x: 230, y: 327, vx: 0, vy: -300 };

  const event = Breakout.step(state);

  assert.equal(event, "cleared");
  assert.equal(state.status, "cleared");
  assert.equal(state.score, 6);
});

// --- lives ------------------------------------------------------------------

test("a ball lost to the pit costs a life and re-serves from the paddle", () => {
  const state = makeState();
  state.ball = { x: 240, y: 566, vx: 0, vy: 300 };

  const event = Breakout.step(state);

  assert.equal(event, "lostBall");
  assert.equal(state.lives, Breakout.LIVES - 1);
  assert.ok(state.ball.y < Breakout.PADDLE.y, "fresh ball sits on the paddle");
  assert.ok(state.ball.vy < 0, "and launches upward");
});

test("losing the last life ends the game", () => {
  const state = makeState();
  state.lives = 1;
  state.ball = { x: 240, y: 566, vx: 0, vy: 300 };

  const event = Breakout.step(state);

  assert.equal(event, "died");
  assert.equal(state.status, "gameover");
});

test("after gameover, step() does nothing", () => {
  const state = makeState();
  state.status = "gameover";
  const frozen = structuredClone({ ...state, random: null });

  const event = Breakout.step(state, 1);

  assert.equal(event, null);
  assert.deepEqual(structuredClone({ ...state, random: null }), frozen);
});
