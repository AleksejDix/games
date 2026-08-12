// ============================================================================
// Tests for the Pong core. Written BEFORE the implementation (TDD) — this
// file is the specification of the game's rules.
//
// Snake's world was DISCRETE: integer grid cells, one hop per tick. Pong's
// world is CONTINUOUS: positions and velocities are floats, and each tick
// advances physics by a fixed slice of time (DT). Everything else about the
// architecture carries over — a pure core with injected randomness, so every
// test is deterministic.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Pong from "./logic.mjs";

// Same trick as in Snake: a scripted "random" so serves are predictable.
function fakeRandom(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

// random() = 0.5 twice: first pick sends the opening serve RIGHT, second
// makes the serve angle exactly 0 — the ball flies dead horizontal.
function makeState() {
  return Pong.createState({ random: fakeRandom(0.5) });
}

// --- basic motion -----------------------------------------------------------

test("the ball travels by velocity × DT each tick", () => {
  const state = makeState();
  state.ball = { x: 400, y: 250, vx: 120, vy: 60 };

  Pong.step(state);

  // 120 u/s over 1/120 s = exactly 1 unit; 60 u/s = exactly 0.5.
  assert.equal(state.ball.x, 401);
  assert.equal(state.ball.y, 250.5);
});

test("paddles move with input and are clamped to the court", () => {
  const state = makeState();

  for (let i = 0; i < 400; i++) Pong.step(state, { left: -1 });

  // 400 ticks upward is far more than the court allows — the paddle must
  // stop with its top edge on the wall, i.e. its CENTER at half its height.
  assert.equal(state.paddles.left.y, Pong.PADDLE.height / 2);
});

// --- walls ------------------------------------------------------------------

test("the ball bounces off the top wall", () => {
  const state = makeState();
  state.ball = { x: 400, y: 7, vx: 100, vy: -300 };

  const event = Pong.step(state);

  assert.equal(event, "wall");
  assert.ok(state.ball.vy > 0, "vertical velocity should flip downward");
});

test("the ball bounces off the bottom wall", () => {
  const state = makeState();
  state.ball = { x: 400, y: state.height - 7, vx: 100, vy: 300 };

  const event = Pong.step(state);

  assert.equal(event, "wall");
  assert.ok(state.ball.vy < 0, "vertical velocity should flip upward");
});

// --- paddle bounces ---------------------------------------------------------

test("a paddle deflects the ball back", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 40, y: 250, vx: -300, vy: 0 };

  const event = Pong.step(state);

  assert.equal(event, "paddle");
  assert.ok(state.ball.vx > 0, "ball should head back toward the right");
});

test("hitting the paddle's upper half sends the ball upward", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 40, y: 220, vx: -300, vy: 0 }; // 30 units above center

  Pong.step(state);

  assert.ok(state.ball.vy < 0, "ball should angle up");
});

test("hitting the paddle's lower half sends the ball downward", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 40, y: 280, vx: -300, vy: 0 }; // 30 units below center

  Pong.step(state);

  assert.ok(state.ball.vy > 0, "ball should angle down");
});

test("each paddle hit speeds the ball up", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 40, y: 250, vx: -300, vy: 0 };

  Pong.step(state);

  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  assert.ok(speed > 300, `rally should accelerate (got ${speed})`);
});

test("the ball's speed is capped", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 40, y: 250, vx: -Pong.BALL.maxSpeed, vy: 0 };

  Pong.step(state);

  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  assert.ok(speed <= Pong.BALL.maxSpeed + 1e-9, `speed ${speed} over cap`);
});

test("a ball that misses the paddle is not deflected", () => {
  const state = makeState();
  state.paddles.left.y = 100; // paddle far away from the ball's row
  state.ball = { x: 40, y: 400, vx: -300, vy: 0 };

  const event = Pong.step(state);

  assert.equal(event, "moved");
  assert.ok(state.ball.vx < 0, "ball should sail on past the paddle");
});

// --- scoring ----------------------------------------------------------------

test("ball out on the left scores for the right player and reserves", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: -10, y: 400, vx: -300, vy: 0 }; // already behind the paddle

  const event = Pong.step(state);

  assert.equal(event, "scored");
  assert.equal(state.scores.right, 1);
  assert.equal(state.ball.x, state.width / 2, "ball re-centered");
  assert.ok(state.ball.vx < 0, "serve goes toward the player who conceded");
});

test("ball out on the right scores for the left player", () => {
  const state = makeState();
  state.ball = { x: state.width + 10, y: 400, vx: 300, vy: 0 };

  const event = Pong.step(state);

  assert.equal(event, "scored");
  assert.equal(state.scores.left, 1);
  assert.ok(state.ball.vx > 0, "serve goes toward the player who conceded");
});

test("first to WIN_SCORE ends the game", () => {
  const state = makeState();
  state.scores.right = Pong.WIN_SCORE - 1;
  state.ball = { x: -10, y: 400, vx: -300, vy: 0 };

  Pong.step(state);

  assert.equal(state.status, "gameover");
  assert.equal(state.scores.right, Pong.WIN_SCORE);
});

test("after gameover, step() does nothing", () => {
  const state = makeState();
  state.status = "gameover";
  const frozen = structuredClone({ ...state, random: null });

  const event = Pong.step(state, { left: 1, right: 1 });

  assert.equal(event, null);
  assert.deepEqual(structuredClone({ ...state, random: null }), frozen);
});

// --- the AI opponent --------------------------------------------------------
// The AI is just another INPUT SOURCE: a pure function from state to
// -1 | 0 | 1, exactly what a human's keys produce. That's what makes it
// testable — and swappable for a second human later.

test("the AI chases the ball", () => {
  const state = makeState();
  state.paddles.right.y = 250;

  state.ball.y = 100; // ball far above the paddle
  assert.equal(Pong.aiInput(state, "right"), -1, "should move up");

  state.ball.y = 400; // ball far below
  assert.equal(Pong.aiInput(state, "right"), 1, "should move down");
});

test("the AI has a dead zone so it doesn't jitter in place", () => {
  const state = makeState();
  state.paddles.right.y = 250;
  state.ball.y = 252; // ball almost level with the paddle center

  assert.equal(Pong.aiInput(state, "right"), 0);
});

// --- settings ----------------------------------------------------------------
// Settings are just createState parameters. The shell will read them from a
// form and localStorage; the core only ever sees plain values.

test("createState accepts a custom win score", () => {
  const state = Pong.createState({ random: fakeRandom(0.5), winScore: 5 });
  state.scores.right = 4;
  state.ball = { x: -10, y: 400, vx: -300, vy: 0 };

  Pong.step(state);

  assert.equal(state.status, "gameover");
});

test("AI options merge over the defaults", () => {
  const state = Pong.createState({ random: fakeRandom(0.5), ai: { speed: 0.5 } });

  assert.equal(state.ai.speed, 0.5);
  assert.equal(state.ai.deadZone, Pong.AI.deadZone, "unset options keep defaults");
});

test("a slower AI produces a fractional input", () => {
  // Difficulty works through the SAME channel as everything else: the AI
  // returns a smaller input value, like an analog stick pushed halfway.
  const state = Pong.createState({ random: fakeRandom(0.5), ai: { speed: 0.5 } });
  state.paddles.right.y = 250;
  state.ball.y = 100;

  assert.equal(Pong.aiInput(state, "right"), -0.5);
});

test("fractional input moves the paddle at fractional speed", () => {
  const state = makeState();
  const before = state.paddles.left.y;

  Pong.step(state, { left: 0.5 });

  assert.equal(state.paddles.left.y, before + 0.5 * Pong.PADDLE.speed * Pong.DT);
});

test("input beyond ±1 is clamped to full speed", () => {
  // No input source gets to move a paddle faster than the paddle can move.
  const state = makeState();
  const before = state.paddles.left.y;

  Pong.step(state, { left: 5 });

  assert.equal(state.paddles.left.y, before + Pong.PADDLE.speed * Pong.DT);
});
