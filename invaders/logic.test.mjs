// ============================================================================
// Tests for the Space Invaders core — written before the implementation.
//
// The new entity pattern: a FORMATION. Fifty invaders move as one organism,
// in discrete lockstep jumps — march sideways, drop and reverse at the
// edge — and the march accelerates as the fleet thins (a rule here; in the
// 1978 cabinet it was a hardware accident: fewer sprites drew faster).
// Also classic: ONE player laser in the air at a time, bombs raining from
// the bottom-most invader of a column, and bunkers that crumble block by
// block under fire from both sides.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Invaders from "./logic.mjs";
import { fakeRandom } from "../shared/testing.mjs";

// random() = 0.5 never beats the per-tick bomb chance (~0.005), so the
// fleet holds its fire unless a test scripts otherwise.
function makeState() {
  return Invaders.createState({ random: fakeRandom(0.5) });
}

const TOTAL = Invaders.FLEET.cols * Invaders.FLEET.rows;

// --- setup ------------------------------------------------------------------

test("a new game: a full fleet, bunkers, lives, no shots in the air", () => {
  const state = makeState();

  assert.equal(state.invaders.length, TOTAL);
  assert.equal(
    state.blocks.length,
    Invaders.BUNKERS.count * Invaders.BUNKERS.cols * Invaders.BUNKERS.rows
  );
  assert.equal(state.lives, Invaders.LIVES);
  assert.equal(state.wave, 1);
  assert.equal(state.laser, null);
  assert.deepEqual(state.bombs, []);
  assert.equal(state.status, "playing");
});

test("createState accepts custom lives and bomb rate", () => {
  const state = Invaders.createState({
    random: fakeRandom(0.5),
    lives: 5,
    bombRate: 1.1,
  });

  assert.equal(state.lives, 5);
  assert.equal(state.bombRate, 1.1);
});

// --- the cannon ---------------------------------------------------------------

test("the cannon slides and is clamped to the court", () => {
  const state = makeState();

  for (let i = 0; i < 400; i++) Invaders.step(state, { move: -1 });

  assert.equal(state.cannon.x, Invaders.CANNON.width / 2);
});

test("firing raises the classic constraint: ONE laser in the air", () => {
  const state = makeState();

  const first = Invaders.step(state, { fire: true });
  const second = Invaders.step(state, { fire: true });

  assert.deepEqual(first, [{ type: "fired" }]);
  assert.deepEqual(second, [], "no second laser while one flies");
  assert.ok(state.laser, "the laser exists");
  assert.ok(state.laser.y < Invaders.CANNON.y, "and leaves upward");
});

test("a laser that exits the top is spent — the cannon may fire again", () => {
  const state = makeState();
  state.laser = { x: 300, y: -9 }; // one tick from fully off-screen

  Invaders.step(state);

  assert.equal(state.laser, null);
});

// --- the march ----------------------------------------------------------------

test("the fleet marches sideways in discrete jumps", () => {
  const state = makeState();
  const before = state.fleet.x;
  state.fleet.timer = 1;

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "march", note: 0 }]);
  assert.equal(state.fleet.x, before + Invaders.FLEET.stepX);
  assert.ok(state.fleet.timer > 1, "the timer rewinds for the next jump");
});

test("at the edge the fleet drops a row and reverses", () => {
  const state = makeState();
  state.fleet.x = 160; // one more right-jump would cross the edge
  state.fleet.dir = 1;
  state.fleet.timer = 1;
  const y = state.fleet.y;

  Invaders.step(state);

  assert.equal(state.fleet.x, 160, "no sideways move on the drop jump");
  assert.equal(state.fleet.y, y + Invaders.FLEET.dropY);
  assert.equal(state.fleet.dir, -1);
});

test("a thinner fleet marches faster", () => {
  const full = makeState();
  full.fleet.timer = 1;
  Invaders.step(full);

  const lone = makeState();
  lone.invaders = [{ col: 5, row: 2 }];
  lone.fleet.timer = 1;
  Invaders.step(lone);

  assert.ok(
    lone.fleet.timer < full.fleet.timer,
    "one survivor rewinds a much shorter timer than fifty"
  );
});

test("the fleet reaching the cannon line is the invasion — game over", () => {
  const state = makeState();
  state.fleet.y = 390; // the next drop puts the bottom row on the cannon
  state.fleet.x = 160;
  state.fleet.dir = 1;
  state.fleet.timer = 1;

  const events = Invaders.step(state);

  assert.deepEqual(events, [
    { type: "march", note: 0 },
    { type: "died", cause: "invasion" },
  ]);
  assert.equal(state.status, "gameover");
});

// --- shooting invaders ----------------------------------------------------------

test("a laser kill scores by row and thins the fleet", () => {
  const state = makeState();
  // Invader (col 0, row 4) sits at x 60..88, y 224..244 — park the laser
  // just underneath, flying up into it.
  state.laser = { x: 74, y: 230 };

  const events = Invaders.step(state);

  assert.deepEqual(events, [
    { type: "invaderHit", row: 4, points: Invaders.FLEET.points[4], remaining: TOTAL - 1 },
  ]);
  assert.equal(state.score, Invaders.FLEET.points[4]);
  assert.equal(state.invaders.length, TOTAL - 1);
  assert.equal(state.laser, null, "the laser is spent");
});

test("clearing the fleet brings the next wave, one drop lower", () => {
  const state = makeState();
  state.invaders = [{ col: 0, row: 4 }];
  state.laser = { x: 74, y: 230 };

  const events = Invaders.step(state);

  assert.deepEqual(events, [
    { type: "invaderHit", row: 4, points: Invaders.FLEET.points[4], remaining: 0 },
    { type: "wave", number: 2 },
  ]);
  assert.equal(state.invaders.length, TOTAL, "a fresh fleet");
  assert.equal(state.fleet.y, Invaders.FLEET.top + Invaders.FLEET.dropY);
});

// --- bunkers ---------------------------------------------------------------------

test("the laser chews a block off a bunker from below", () => {
  const state = makeState();
  const total = state.blocks.length;
  // First bunker's first block spans x 114..126, y 480..492.
  state.laser = { x: 120, y: 495 };

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "bunkerHit" }]);
  assert.equal(state.blocks.length, total - 1);
  assert.equal(state.laser, null);
});

test("bombs chew blocks off from above", () => {
  const state = makeState();
  const total = state.blocks.length;
  state.bombs = [{ x: 120, y: 470 }];

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "bunkerHit" }]);
  assert.equal(state.blocks.length, total - 1);
  assert.deepEqual(state.bombs, [], "the bomb is spent");
});

// --- bombs ------------------------------------------------------------------------

test("a bomb drops from the bottom-most invader of its column", () => {
  const state = makeState();
  // First roll beats the drop chance; second picks survivor index 0
  // (col 0) — the bottom-most invader of column 0 is row 4.
  state.random = fakeRandom(0.0001, 0.0);

  Invaders.step(state);

  assert.equal(state.bombs.length, 1);
  assert.equal(state.bombs[0].x, 74, "under column 0's center");
  assert.ok(state.bombs[0].y > 244, "released below row 4, already falling");
});

test("a bomb hitting the cannon costs a life and raises a shield", () => {
  const state = makeState();
  state.bombs = [{ x: 300, y: 550 }]; // right above the cannon

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "cannonHit", livesLeft: Invaders.LIVES - 1 }]);
  assert.equal(state.lives, Invaders.LIVES - 1);
  assert.equal(state.invulnerable, Invaders.CANNON.shield);
  assert.deepEqual(state.bombs, []);
});

test("the shield lets bombs fall past harmlessly", () => {
  const state = makeState();
  state.invulnerable = 10;
  state.bombs = [{ x: 300, y: 550 }];

  const events = Invaders.step(state);

  assert.deepEqual(events, []);
  assert.equal(state.lives, Invaders.LIVES);
  assert.equal(state.bombs.length, 1, "the bomb keeps falling");
  assert.equal(state.invulnerable, 9);
});

test("the last life ends the game", () => {
  const state = makeState();
  state.lives = 1;
  state.bombs = [{ x: 300, y: 550 }];

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "died", cause: "shot" }]);
  assert.equal(state.status, "gameover");
});

// --- the status machine --------------------------------------------------------

test("the status machine: losing is the only exit", () => {
  const state = makeState();

  Invaders.transition(state, "gameover");

  assert.throws(
    () => Invaders.transition(state, "playing"),
    /illegal status change/
  );
});
