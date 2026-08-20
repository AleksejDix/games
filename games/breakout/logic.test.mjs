// ============================================================================
// Tests for the Breakout core — written before the implementation.
//
// Breakout is Pong turned solo: the same continuous physics and paddle
// re-aiming, but the opponent is a WALL OF BRICKS. The new idea this game
// teaches is rectangle-vs-rectangle (AABB) collision with reflection on the
// axis of least penetration — plus lives and a win condition.
//
// step() returns EVENTS AS DATA: an array of {type, ...payload} objects.
// Breakout is the game that demanded it — a single tick can bounce off a
// wall AND smash a brick, and the brick payload (points, remaining) feeds
// the shell's rising-pitch sound without the shell digging through state.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Breakout from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// A game starts in the "serving" state (ball glued to the paddle); most
// tests want live physics, so the helper launches immediately.
// random() = 0.5 → launch angle 0 → the ball flies straight up from the
// paddle center (240, just above the paddle line).
function makeState() {
  const state = Breakout.createState({ random: fakeRandom(0.5) });
  Breakout.launch(state);
  return state;
}

// --- the status machine -------------------------------------------------------
// Breakout's status graph grew to 4 states and 5 transitions — big enough
// to formalize: an explicit TRANSITIONS table, and a guard that THROWS on
// an illegal jump instead of silently corrupting the game. (Snake and Pong
// keep their 2-state fields informal on purpose — ceremony should be
// proportional to the graph.)

test("a new game starts serving, with the ball glued to the paddle", () => {
  const state = Breakout.createState({ random: fakeRandom(0.5) });

  assert.equal(state.status, "serving");
  assert.equal(state.ball.x, state.paddle.x);
  assert.equal(state.ball.vx, 0);
  assert.equal(state.ball.vy, 0);
});

test("while serving, the ball rides the paddle — aiming before the launch", () => {
  const state = Breakout.createState({ random: fakeRandom(0.5) });
  const before = state.paddle.x;

  const events = Breakout.step(state, 1); // hold right

  assert.deepEqual(events, []);
  assert.ok(state.paddle.x > before, "the paddle moves while serving");
  assert.equal(state.ball.x, state.paddle.x, "the glued ball follows");
});

test("launch() fires the ball and starts play", () => {
  const state = Breakout.createState({ random: fakeRandom(0.5) });

  const events = Breakout.launch(state);

  assert.deepEqual(events, [{ type: "launched" }]);
  assert.equal(state.status, "playing");
  assert.ok(state.ball.vy < 0, "the ball heads up");
});

test("launch() outside the serving state does nothing", () => {
  const state = makeState(); // already launched

  assert.deepEqual(Breakout.launch(state), []);
});

test("an illegal status transition throws instead of corrupting the game", () => {
  const state = makeState();
  state.status = "gameover"; // a terminal state — no exits

  assert.throws(
    () => Breakout.transition(state, "playing"),
    /illegal status change/
  );
});

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

  const events = Breakout.step(state);

  assert.deepEqual(events, []); // an uneventful tick
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

  const events = Breakout.step(state);

  assert.deepEqual(events, [{ type: "wall" }]);
  assert.ok(state.ball.vx > 0);
});

test("the ball bounces off the ceiling", () => {
  const state = makeState();
  state.ball = { x: 240, y: 6, vx: 60, vy: -300 };

  const events = Breakout.step(state);

  assert.deepEqual(events, [{ type: "wall" }]);
  assert.ok(state.ball.vy > 0);
});

// --- the paddle -------------------------------------------------------------

test("the paddle re-aims the ball upward", () => {
  const state = makeState();
  state.paddle.x = 240;
  state.ball = { x: 240, y: 508, vx: 0, vy: 300 };

  const events = Breakout.step(state);

  assert.deepEqual(events, [{ type: "paddle" }]);
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

  const events = Breakout.step(state);

  // The payload carries everything the shell's sound and effects need.
  assert.deepEqual(events, [{ type: "brick", points: 4, row: 2, remaining: 1 }]);
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

test("a wall bounce and a brick hit in the same tick are BOTH reported", () => {
  // The tick that forced events to become an array: with a single return
  // value, one of these two facts was silently dropped.
  const state = makeState();
  state.bricks = [
    { x: 0, y: 300, row: 3, points: 3 },
    { x: 200, y: 60, row: 0, points: 6 },
  ];
  // Heading up-and-left into the corner where wall meets brick underside.
  state.ball = { x: 6, y: 326, vx: -300, vy: -300 };

  const events = Breakout.step(state);

  assert.deepEqual(events, [
    { type: "wall" },
    { type: "brick", points: 3, row: 3, remaining: 1 },
  ]);
});

test("destroying the last brick wins the game", () => {
  const state = makeState();
  state.bricks = [{ x: 200, y: 300, row: 0, points: 6 }];
  state.ball = { x: 230, y: 327, vx: 0, vy: -300 };

  const events = Breakout.step(state);

  // The brick still reports itself, then the win — two events, in order.
  assert.deepEqual(events, [
    { type: "brick", points: 6, row: 0, remaining: 0 },
    { type: "cleared" },
  ]);
  assert.equal(state.status, "cleared");
  assert.equal(state.score, 6);
});

// --- lives ------------------------------------------------------------------

test("a ball lost to the pit costs a life and returns to serving", () => {
  const state = makeState();
  state.ball = { x: 240, y: 566, vx: 0, vy: 300 };

  const events = Breakout.step(state);

  assert.deepEqual(events, [{ type: "lostBall", livesLeft: Breakout.LIVES - 1 }]);
  assert.equal(state.lives, Breakout.LIVES - 1);
  // No instant re-launch: back to the serving state, glued and aimable.
  assert.equal(state.status, "serving");
  assert.equal(state.ball.x, state.paddle.x);
  assert.equal(state.ball.vy, 0);
});

test("losing the last life ends the game", () => {
  const state = makeState();
  state.lives = 1;
  state.ball = { x: 240, y: 566, vx: 0, vy: 300 };

  const events = Breakout.step(state);

  assert.deepEqual(events, [{ type: "died" }]);
  assert.equal(state.status, "gameover");
});

test("after gameover, step() does nothing", () => {
  const state = makeState();
  state.status = "gameover";
  const frozen = structuredClone({ ...state, random: null });

  const events = Breakout.step(state, 1);

  assert.deepEqual(events, []);
  assert.deepEqual(structuredClone({ ...state, random: null }), frozen);
});

// --- the knob dialect --------------------------------------------------------

test("input { to } parks the paddle there — the 1976 potentiometer", () => {
  const state = Breakout.createState({ random: fakeRandom(0.5) });

  Breakout.step(state, { to: 300 });
  assert.equal(state.paddle.x, 300, "the paddle rides the knob");

  Breakout.step(state, { to: -50 });
  const half = state.paddle.width / 2;
  assert.equal(state.paddle.x, half, "the knob clamps at the walls");
});
