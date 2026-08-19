// ============================================================================
// Tests for the Flappy core — written before the implementation. The
// newest game in the catalog (2013), and the purest input: ONE verb,
// flap(), an upward impulse against relentless gravity. Pipes stream in
// from a lazily extended world list (Racer's road, standing upright),
// and the ready → playing → gameover machine is Breakout's serving idea:
// the world waits for your first flap.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Flappy from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const makeState = () => Flappy.createState({ random: fakeRandom(0.5) });

test("a new game waits, hovering, pipes already on the horizon", () => {
  const state = makeState();

  assert.equal(state.status, "ready");
  assert.ok(state.pipes.length > 0, "the future is visible");
  assert.equal(state.score, 0);
});

test("the world holds still until the first flap", () => {
  const state = makeState();
  const y = state.bird.y;

  assert.deepEqual(Flappy.step(state), []);
  assert.equal(state.bird.y, y, "no gravity in the ready hover");

  const events = Flappy.flap(state);
  assert.deepEqual(events, [{ type: "flapped" }]);
  assert.equal(state.status, "playing");
  assert.ok(state.bird.vy < 0, "the first flap lifts");
});

test("gravity never stops pulling", () => {
  const state = makeState();
  Flappy.flap(state);
  const vy = state.bird.vy;

  Flappy.step(state);

  assert.ok(state.bird.vy > vy, "falling faster every tick");
});

test("a flap is an impulse: velocity is SET, not added", () => {
  const state = makeState();
  Flappy.flap(state);
  state.bird.vy = 400; // plummeting

  Flappy.flap(state);

  assert.equal(state.bird.vy, Flappy.BIRD.flap);
});

test("the world scrolls and new pipes keep coming", () => {
  const state = makeState();
  Flappy.flap(state);
  const count = state.pipes.length;
  state.distance += 2000;

  Flappy.step(state);

  assert.ok(state.pipes.length !== count || state.pipes.at(-1).x > 2000,
    "the pipe list follows the distance");
});

test("threading a pipe scores exactly once", () => {
  const state = makeState();
  Flappy.flap(state);
  state.bird.vy = 0;
  state.pipes = [{ x: state.distance + Flappy.BIRD.x - 80, gapY: state.bird.y, passed: false }];

  const events = Flappy.step(state);

  assert.ok(events.some((e) => e.type === "passed" && e.score === 1));
  assert.equal(state.score, 1);
  assert.deepEqual(Flappy.step(state).filter((e) => e.type === "passed"), [], "no double pay");
});

test("a pipe lip is the end", () => {
  const state = makeState();
  Flappy.flap(state);
  state.bird.vy = 0;
  // A pipe right on the bird, with its gap far away from the bird's row.
  state.pipes = [{ x: state.distance + Flappy.BIRD.x, gapY: state.bird.y + 300, passed: false }];

  const events = Flappy.step(state);

  assert.ok(events.some((e) => e.type === "died"));
  assert.equal(state.status, "gameover");
});

test("the ground is the end", () => {
  const state = makeState();
  Flappy.flap(state);
  state.bird.y = Flappy.SKY.height - Flappy.GROUND - Flappy.BIRD.r;
  state.bird.vy = 300;

  const events = Flappy.step(state);

  assert.ok(events.some((e) => e.type === "died"));
});

test("the ceiling only bumps", () => {
  const state = makeState();
  Flappy.flap(state);
  state.bird.y = Flappy.BIRD.r;
  state.bird.vy = -500;
  state.pipes = [{ x: state.distance + 5000, gapY: 300, passed: false }];

  const events = Flappy.step(state);

  assert.ok(!events.some((e) => e.type === "died"), "the sky forgives");
  assert.ok(state.bird.y >= Flappy.BIRD.r);
});

test("after the end, no flapping helps", () => {
  const state = makeState();
  state.status = "gameover";

  assert.deepEqual(Flappy.flap(state), []);
  assert.deepEqual(Flappy.step(state), []);
});

test("the status machine: ready → playing → gameover, one way", () => {
  const state = makeState();

  Flappy.transition(state, "playing");
  Flappy.transition(state, "gameover");

  assert.throws(() => Flappy.transition(state, "playing"), /illegal status change/);
});
