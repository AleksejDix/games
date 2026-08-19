// ============================================================================
// Tests for the Pong core. Written BEFORE the implementation (TDD) — this
// file is the specification of the game's rules.
//
// Snake's world was DISCRETE: integer grid cells, one hop per tick. Pong's
// world is CONTINUOUS: positions and velocities are floats, and each tick
// advances physics by a fixed slice of time (DT). Everything else about the
// architecture carries over — a pure core with injected randomness, so every
// test is deterministic.
//
// step() returns EVENTS AS DATA: an array of {type, ...payload} objects.
// Empty array = an uneventful tick. Payloads carry the facts the shell
// would otherwise have to re-derive from state (who scored, who won).
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Pong from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// random() = 0.5 twice: first pick sends the opening serve RIGHT, second
// makes the serve angle exactly 0 — the ball flies dead horizontal.
// started: true skips the ready screen — these tests are about play.
function makeState() {
  return Pong.createState({ random: fakeRandom(0.5), started: true });
}

// --- the start screen -------------------------------------------------------

test("a new court is ready: the serve hangs frozen until start()", () => {
  const state = Pong.createState({ random: fakeRandom(0.5) });
  assert.equal(state.status, "ready");
  const ball = { ...state.ball };

  assert.deepEqual(Pong.step(state, { left: 1 }), [], "ready ticks are empty");
  assert.deepEqual(state.ball, ball, "the ball has not moved");

  const events = Pong.start(state);
  assert.deepEqual(events, [{ type: "started" }]);
  assert.equal(state.status, "playing");
  assert.deepEqual(Pong.start(state), [], "a second start is a no-op");
});

// --- basic motion -----------------------------------------------------------

test("the ball travels by velocity × DT each tick", () => {
  const state = makeState();
  state.ball = { x: 400, y: 250, vx: 120, vy: 60 };

  Pong.step(state);

  // 120 u/s over 1/120 s = exactly 1 unit; 60 u/s = exactly 0.5.
  assert.equal(state.ball.x, 401);
  assert.equal(state.ball.y, 250.5);
});

test("an uneventful tick returns no events", () => {
  const state = makeState();
  state.ball = { x: 400, y: 250, vx: 120, vy: 60 };

  assert.deepEqual(Pong.step(state), []);
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

  const events = Pong.step(state);

  assert.deepEqual(events, [{ type: "wall" }]);
  assert.ok(state.ball.vy > 0, "vertical velocity should flip downward");
});

test("the ball bounces off the bottom wall", () => {
  const state = makeState();
  state.ball = { x: 400, y: state.height - 7, vx: 100, vy: 300 };

  const events = Pong.step(state);

  assert.deepEqual(events, [{ type: "wall" }]);
  assert.ok(state.ball.vy < 0, "vertical velocity should flip upward");
});

// --- paddle bounces ---------------------------------------------------------

test("a paddle deflects the ball back", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 44, y: 250, vx: -300, vy: 0 };

  const events = Pong.step(state);

  assert.deepEqual(events, [{ type: "paddle", side: "left" }]);
  assert.ok(state.ball.vx > 0, "ball should head back toward the right");
});

test("hitting the paddle's upper half sends the ball upward", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 44, y: 220, vx: -300, vy: 0 }; // 30 units above center

  Pong.step(state);

  assert.ok(state.ball.vy < 0, "ball should angle up");
});

test("hitting the paddle's lower half sends the ball downward", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 44, y: 280, vx: -300, vy: 0 }; // 30 units below center

  Pong.step(state);

  assert.ok(state.ball.vy > 0, "ball should angle down");
});

test("each paddle hit speeds the ball up", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 44, y: 250, vx: -300, vy: 0 };

  Pong.step(state);

  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  assert.ok(speed > 300, `rally should accelerate (got ${speed})`);
});

test("the ball's speed is capped", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 44, y: 250, vx: -Pong.BALL.maxSpeed, vy: 0 };

  Pong.step(state);

  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  assert.ok(speed <= Pong.BALL.maxSpeed + 1e-9, `speed ${speed} over cap`);
});

test("a ball that misses the paddle is not deflected", () => {
  const state = makeState();
  state.paddles.left.y = 100; // paddle far away from the ball's row
  state.ball = { x: 44, y: 400, vx: -300, vy: 0 };

  const events = Pong.step(state);

  assert.deepEqual(events, []);
  assert.ok(state.ball.vx < 0, "ball should sail on past the paddle");
});

test("a paddle sliding in late cannot rescue a ball already past its face", () => {
  // Regression: a static "behind" window caught any ball within a
  // paddle-width past the face and teleported it back — a physically
  // impossible save. The catch must happen the tick the ball CROSSES.
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: 40, y: 250, vx: -300, vy: 0 }; // edge 2 units past the face

  const events = Pong.step(state);

  assert.deepEqual(events, []);
  assert.ok(state.ball.vx < 0, "the miss stays missed");
});

// --- scoring ----------------------------------------------------------------

test("ball out on the left scores for the right player and reserves", () => {
  const state = makeState();
  state.paddles.left.y = 250;
  state.ball = { x: -10, y: 400, vx: -300, vy: 0 }; // already behind the paddle

  const events = Pong.step(state);

  assert.deepEqual(events, [{ type: "scored", by: "right" }]);
  assert.equal(state.scores.right, 1);
  assert.equal(state.ball.x, state.width / 2, "ball re-centered");
  assert.ok(state.ball.vx < 0, "serve goes toward the player who conceded");
});

test("ball out on the right scores for the left player", () => {
  const state = makeState();
  state.ball = { x: state.width + 10, y: 400, vx: 300, vy: 0 };

  const events = Pong.step(state);

  assert.deepEqual(events, [{ type: "scored", by: "left" }]);
  assert.equal(state.scores.left, 1);
  assert.ok(state.ball.vx > 0, "serve goes toward the player who conceded");
});

test("the winning point reports the score AND the gameover, with the winner", () => {
  const state = makeState();
  state.scores.right = Pong.WIN_SCORE - 1;
  state.ball = { x: -10, y: 400, vx: -300, vy: 0 };

  const events = Pong.step(state);

  // Two events in one tick — and the winner arrives as data, so the shell
  // never re-derives it by comparing scores.
  assert.deepEqual(events, [
    { type: "scored", by: "right" },
    { type: "gameover", winner: "right" },
  ]);
  assert.equal(state.status, "gameover");
  assert.equal(state.scores.right, Pong.WIN_SCORE);
});

test("after gameover, step() does nothing", () => {
  const state = makeState();
  state.status = "gameover";
  const frozen = structuredClone({ ...state, random: null });

  const events = Pong.step(state, { left: 1, right: 1 });

  assert.deepEqual(events, []);
  assert.deepEqual(structuredClone({ ...state, random: null }), frozen);
});

// --- the AI opponent --------------------------------------------------------
// The AI is just another INPUT SOURCE: a pure function from state to an
// axis value, exactly what a human's keys produce. That's what makes it
// testable — and swappable for a second human later.

test("the AI chases the ball", () => {
  const state = makeState();
  state.paddles.right.y = 250;

  state.ball.y = 100; // ball far above the paddle
  assert.equal(Pong.botInput(state, "right"), -1, "should move up");

  state.ball.y = 400; // ball far below
  assert.equal(Pong.botInput(state, "right"), 1, "should move down");
});

test("the AI has a dead zone so it doesn't jitter in place", () => {
  const state = makeState();
  state.paddles.right.y = 250;
  state.ball.y = 252; // ball almost level with the paddle center

  assert.equal(Pong.botInput(state, "right"), 0);
});

// --- settings ----------------------------------------------------------------
// Settings are just createState parameters. The shell will read them from a
// form and localStorage; the core only ever sees plain values.

test("createState accepts a custom win score", () => {
  const state = Pong.createState({ random: fakeRandom(0.5), winScore: 5, started: true });
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

  assert.equal(Pong.botInput(state, "right"), -0.5);
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

// --- the status machine --------------------------------------------------------

test("the status machine: match end is the only exit; restart is a new world", () => {
  const state = makeState();

  Pong.transition(state, "gameover");
  assert.equal(state.status, "gameover");

  assert.throws(
    () => Pong.transition(state, "playing"),
    /illegal status change/
  );
});
