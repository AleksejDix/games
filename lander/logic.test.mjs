// ============================================================================
// Tests for the Lunar Lander core — written before the implementation.
//
// Asteroids' flight model plus one relentless new force: GRAVITY. And a
// twist no game here has had: the goal is to STOP — touch a flat pad
// gently and upright. Which means two terminal states, and only one of
// them is failure. Fuel is the score: whatever you didn't burn.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Lander from "./logic.mjs";
import { fakeRandom } from "../shared/testing.mjs";

// random() = 0.5 makes every terrain point the same height — a perfectly
// flat moon, ideal for physics tests (and everywhere is a pad).
function makeState() {
  return Lander.createState({ random: fakeRandom(0.5) });
}

// --- setup ------------------------------------------------------------------

test("a new game: full tank, jagged ground with somewhere flat to land", () => {
  const state = Lander.createState({ random: fakeRandom(0.2, 0.8, 0.5) });

  assert.equal(state.fuel, Lander.SHIP.fuel);
  assert.equal(state.status, "playing");
  assert.equal(state.terrain[0].x, 0);
  assert.equal(state.terrain.at(-1).x, state.width, "ground spans the sky");
  const flatSomewhere = state.terrain.some(
    (p, i) => state.terrain[i + 1] && p.y === state.terrain[i + 1].y
  );
  assert.ok(flatSomewhere, "at least one level segment — a landing pad");
});

test("createState accepts a custom fuel budget", () => {
  const state = Lander.createState({ random: fakeRandom(0.5), fuel: 250 });

  assert.equal(state.fuel, 250);
});

// --- flying -----------------------------------------------------------------

test("gravity never sleeps", () => {
  const state = makeState();

  Lander.step(state);

  assert.ok(state.ship.vy > 0, "an idle ship starts falling");
});

test("a burn pushes along the heading and drains the tank", () => {
  const state = makeState(); // facing up

  Lander.step(state, { thrust: 1 });

  assert.ok(state.ship.vy < 0, "the burn beats gravity");
  assert.ok(state.fuel < Lander.SHIP.fuel, "fuel is spent");
});

test("an empty tank ignores the pedal", () => {
  const state = makeState();
  state.fuel = 0;

  Lander.step(state, { thrust: 1 });

  assert.ok(state.ship.vy > 0, "gravity wins unopposed");
  assert.equal(state.fuel, 0, "no negative fuel");
});

test("turning changes the heading", () => {
  const state = makeState();

  Lander.step(state, { turn: 1 });

  assert.equal(
    state.ship.angle,
    -Math.PI / 2 + Lander.SHIP.turnSpeed * Lander.DT
  );
});

test("the sky wraps horizontally", () => {
  const state = makeState();
  state.ship.x = state.width - 1;
  state.ship.vx = 240;
  state.ship.y = 60; // far above the ground

  Lander.step(state);

  assert.ok(state.ship.x < 5, "re-entered on the left");
});

// --- touching down ----------------------------------------------------------

test("a slow, upright touch on level ground is a LANDING — fuel is the score", () => {
  const state = makeState(); // flat moon at y 370
  state.ship = { x: 320, y: 359.95, vx: 0, vy: 10, angle: -Math.PI / 2 };

  const events = Lander.step(state);

  assert.deepEqual(events, [{ type: "landed", fuel: Math.round(state.fuel) }]);
  assert.equal(state.status, "landed");
  assert.equal(state.score, Math.round(state.fuel));
});

test("coming in too fast is a crash", () => {
  const state = makeState();
  state.ship = { x: 320, y: 359.95, vx: 0, vy: 40, angle: -Math.PI / 2 };

  const events = Lander.step(state);

  assert.deepEqual(events, [{ type: "crashed" }]);
  assert.equal(state.status, "crashed");
});

test("landing on your side is a crash, however gentle", () => {
  const state = makeState();
  state.ship = { x: 320, y: 360.5, vx: 0, vy: 5, angle: 0 }; // lying sideways

  const events = Lander.step(state);

  assert.deepEqual(events, [{ type: "crashed" }]);
});

test("a slope is no place to land, however slow and upright", () => {
  const state = makeState();
  state.terrain = [
    { x: 0, y: 340 },
    { x: state.width, y: 400 },
  ];
  state.ship = { x: 320, y: 360.5, vx: 0, vy: 5, angle: -Math.PI / 2 };

  const events = Lander.step(state);

  assert.deepEqual(events, [{ type: "crashed" }]);
});

// --- the status machine --------------------------------------------------------

test("the status machine: two endings, and only one is failure", () => {
  const good = makeState();
  Lander.transition(good, "landed");
  assert.throws(() => Lander.transition(good, "playing"), /illegal status change/);

  const bad = makeState();
  Lander.transition(bad, "crashed");
  assert.throws(() => Lander.transition(bad, "playing"), /illegal status change/);
});
