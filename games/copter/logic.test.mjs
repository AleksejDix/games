// ============================================================================
// Tests for the Cave Copter core — written before the implementation.
// SFCave, 1998: ONE input, held — thrust fights gravity while the cave
// scrolls past and slowly narrows. Flappy's sibling with the opposite
// philosophy: there the button is an impulse, here it is a force.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Copter from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// 0.5 → every cave offset is 0: a perfectly straight test tunnel.
const makeState = () => Copter.createState({ random: fakeRandom(0.5) });

test("a new game hovers, ready, with the tunnel ahead", () => {
  const state = makeState();

  assert.equal(state.status, "ready");
  assert.ok(state.cave.length >= 2);
  assert.equal(state.score, 0);
});

test("the world holds still until the rotor starts", () => {
  const state = makeState();
  const y = state.y;

  assert.deepEqual(Copter.step(state, { lift: true }), []);
  assert.equal(state.y, y);

  assert.deepEqual(Copter.start(state), [{ type: "started" }]);
  assert.equal(state.status, "playing");
});

test("gravity pulls; the held rotor pushes", () => {
  const falling = makeState();
  Copter.start(falling);
  Copter.step(falling);
  assert.ok(falling.vy > 0, "no lift → sinking");

  const rising = makeState();
  Copter.start(rising);
  Copter.step(rising, { lift: true });
  assert.ok(rising.vy < 0, "held lift → climbing");
});

test("the cave scrolls, extends itself, and pays by the meter", () => {
  const state = makeState();
  Copter.start(state);
  state.distance = 995;
  const segments = state.cave.length;
  state.distance = Copter.TUNNEL.segment * segments; // outrun the generated cave

  Copter.step(state);

  assert.ok(state.cave.length > segments, "new tunnel appears ahead");
  assert.equal(state.score, Math.floor(state.distance / 10));
});

test("the tunnel narrows with distance, down to a floor", () => {
  const state = makeState();

  const near = Copter.gapAt(state, 0);
  const far = Copter.gapAt(state, 5000);
  const veryFar = Copter.gapAt(state, 1e9);

  assert.ok(far < near, "the walls close in");
  assert.equal(veryFar, Copter.TUNNEL.gapMin, "but never fully");
});

test("touching a wall is the end", () => {
  const state = makeState();
  Copter.start(state);
  const center = Copter.centerAt(state, state.distance);
  state.y = center + Copter.gapAt(state, state.distance); // inside the rock

  const events = Copter.step(state);

  assert.ok(events.some((e) => e.type === "died"));
  assert.equal(state.status, "gameover");
});

test("every 500 units of tunnel is a milestone", () => {
  const state = makeState();
  Copter.start(state);
  state.distance = 499.5;
  state.y = Copter.centerAt(state, state.distance); // safely centered

  const events = Copter.step(state);

  assert.ok(events.some((e) => e.type === "milestone"));
});

test("floating blocks spawn ahead, always inside the tunnel", () => {
  const state = makeState();
  Copter.start(state);
  state.distance = 3000;

  Copter.step(state);

  const ahead = state.blocks.filter((b) => b.d > state.distance);
  assert.ok(ahead.length > 0, "the signature obstacles are coming");
  for (const b of ahead) {
    const c = Copter.centerAt(state, b.d);
    const g = Copter.gapAt(state, b.d);
    assert.ok(Math.abs(b.y - c) + Copter.BLOCKS.h / 2 < g, "passable above or below");
  }
});

test("a floating block is as fatal as the wall", () => {
  const state = makeState();
  Copter.start(state);
  state.blocks = [{ d: state.distance + 1, y: state.y }]; // dead ahead, dead center

  const events = Copter.step(state);

  assert.ok(events.some((e) => e.type === "died"));
});

test("the flight leaves a bounded smoke trail", () => {
  const state = makeState();
  Copter.start(state);
  state.y = Copter.centerAt(state, state.distance);

  for (let i = 0; i < 40; i++) Copter.step(state, { lift: i % 2 === 0 });

  assert.ok(state.trail.length > 0, "puffs exist");
  assert.ok(state.trail.length <= 24, "and are swept behind the copter");
});

test("after the crash, the rotor is scrap", () => {
  const state = makeState();
  state.status = "gameover";

  assert.deepEqual(Copter.step(state, { lift: true }), []);
  assert.deepEqual(Copter.start(state), []);
});

test("the status machine: ready → playing → gameover, one way", () => {
  const state = makeState();

  Copter.transition(state, "playing");
  Copter.transition(state, "gameover");

  assert.throws(() => Copter.transition(state, "playing"), /illegal status change/);
});
