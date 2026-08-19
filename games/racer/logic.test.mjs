// ============================================================================
// Tests for the Racer core — written before the implementation.
//
// New ideas: a SCROLLING WORLD — the car never moves forward, the world
// streams past, and `distance` is the real position; a procedurally
// generated road (centerline offsets per segment, extended lazily as you
// drive, curved by smoothstep); and RELATIVE VELOCITY — traffic drives
// forward too, you only pass what you out-run. One resource rules the
// game: TIME, refilled only at checkpoints.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Racer from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// random() = 0.5 → every road offset is 0 (dead straight) and the traffic
// spawn chance never fires — a quiet, empty test track.
function makeState() {
  return Racer.createState({ random: fakeRandom(0.5) });
}

// --- setup ------------------------------------------------------------------

test("a new game: idling at the start line with a full clock", () => {
  const state = makeState();

  assert.equal(state.speed, Racer.SPEED.min);
  assert.equal(state.distance, 0);
  assert.equal(state.time, Racer.TIME.start);
  assert.deepEqual(state.traffic, []);
  assert.ok(state.road.length >= 2, "the road ahead exists");
  assert.equal(state.status, "playing");
});

test("createState accepts a custom clock and traffic rate", () => {
  const state = Racer.createState({
    random: fakeRandom(0.5),
    time: 99,
    trafficRate: 1.4,
  });

  assert.equal(state.time, 99);
  assert.equal(state.trafficRate, 1.4);
});

// --- driving -----------------------------------------------------------------

test("gas accelerates toward the cap", () => {
  const state = makeState();

  Racer.step(state, { gas: 1 });

  assert.ok(state.speed > Racer.SPEED.min);

  state.speed = Racer.SPEED.max;
  Racer.step(state, { gas: 1 });
  assert.equal(state.speed, Racer.SPEED.max, "never past the cap");
});

test("braking sheds speed fast, coasting sheds it slowly", () => {
  const braking = makeState();
  braking.speed = 300;
  Racer.step(braking, { brake: 1 });

  const coasting = makeState();
  coasting.speed = 300;
  Racer.step(coasting);

  assert.ok(braking.speed < coasting.speed, "brakes beat drag");
  assert.ok(coasting.speed < 300, "but drag is real");
});

test("speed never drops below rolling", () => {
  const state = makeState(); // already at minimum

  Racer.step(state, { brake: 1 });

  assert.equal(state.speed, Racer.SPEED.min);
});

test("steering moves the car sideways", () => {
  const state = makeState();
  const before = state.car.x;

  Racer.step(state, { steer: 1 });

  assert.ok(state.car.x > before);
});

test("distance is speed made real", () => {
  const state = makeState(); // rolling at exactly 120 u/s

  Racer.step(state);

  assert.equal(state.distance, Racer.SPEED.min * Racer.DT); // exactly 1
});

test("the road extends itself as you drive", () => {
  const state = makeState();
  const before = state.road.length;
  state.distance = Racer.ROAD.segment * before; // drive past what exists

  Racer.step(state);

  assert.ok(state.road.length > before, "new segments appear ahead");
});

// --- the clock ----------------------------------------------------------------

test("time only runs down", () => {
  const state = makeState();

  Racer.step(state);

  assert.ok(state.time < Racer.TIME.start);
});

test("time running out ends the run", () => {
  const state = makeState();
  state.time = 0.001;

  const events = Racer.step(state);

  assert.deepEqual(events, [{ type: "died", cause: "time" }]);
  assert.equal(state.status, "gameover");
});

test("a checkpoint refills the clock", () => {
  const state = makeState();
  state.speed = 400;
  state.distance = Racer.TIME.checkpointEvery - 1; // one tick away

  const events = Racer.step(state);

  assert.deepEqual(events, [
    { type: "checkpoint", timeBonus: Racer.TIME.checkpointBonus },
  ]);
  assert.ok(state.time > Racer.TIME.start, "the bonus outweighs the tick");
  assert.equal(state.nextCheckpoint, Racer.TIME.checkpointEvery * 2);
});

// --- traffic ------------------------------------------------------------------

test("out-running a car counts as a pass and scores", () => {
  const state = makeState();
  state.speed = 400; // much faster than traffic
  state.traffic = [{ lane: -100, d: 1, passed: false }]; // barely ahead, other lane

  const events = Racer.step(state);

  assert.deepEqual(events, [{ type: "passed", points: Racer.TRAFFIC.points }]);
  assert.equal(state.passes, 1);
  assert.ok(state.score >= Racer.TRAFFIC.points);
});

test("rear-ending traffic is a crash: speed gone, shield up", () => {
  const state = makeState();
  state.traffic = [{ lane: 0, d: 10, passed: false }]; // dead ahead, center lane

  const events = Racer.step(state);

  assert.deepEqual(events, [{ type: "crashed", cause: "traffic" }]);
  assert.equal(state.speed, Racer.SPEED.min);
  assert.equal(state.shield, Racer.CAR.shield);
  assert.deepEqual(state.traffic, [], "the wreck is cleared");
});

test("the shield lets you slip through while it lasts", () => {
  const state = makeState();
  state.shield = 10;
  state.traffic = [{ lane: 0, d: 10, passed: false }];

  const events = Racer.step(state);

  assert.deepEqual(events, []);
  assert.equal(state.shield, 9);
});

test("leaving the road is a crash too", () => {
  const state = makeState(); // straight road centered at 240
  state.car.x = 95; // on the grass

  const events = Racer.step(state);

  assert.deepEqual(events, [{ type: "crashed", cause: "offroad" }]);
  assert.equal(state.speed, Racer.SPEED.min);
  assert.ok(
    Math.abs(state.car.x - state.width / 2) <=
      Racer.ROAD.halfWidth - Racer.CAR.width / 2,
    "the car is set back on the tarmac"
  );
});

// --- the status machine --------------------------------------------------------

test("the status machine: the clock is the only killer", () => {
  const state = makeState();

  Racer.transition(state, "gameover");

  assert.throws(
    () => Racer.transition(state, "playing"),
    /illegal status change/
  );
});

// --- the traffic bug the first test driver found -------------------------------
// Traffic was FASTER than a rolling car: unless you held the gas, every
// spawned car out-ran you before it ever scrolled onto the screen — and
// escapees were never culled, so they clogged the spawn cap. The fixes,
// as tests: a design invariant, spawn placement, and an ahead-cull.

test("traffic is slower than even a rolling car — you always gain on it", () => {
  assert.ok(
    Racer.TRAFFIC.speed < Racer.SPEED.min,
    "otherwise idling players never see a single car"
  );
});

test("traffic joins just over the horizon, never mid-screen", () => {
  const state = makeState();
  state.random = fakeRandom(0.0001, 0.5, 0.5); // chance, distance jitter, lane

  Racer.step(state);

  assert.equal(state.traffic.length, 1);
  const ahead = state.traffic[0].d - state.distance;
  assert.ok(ahead >= 600, `spawned ${ahead} ahead — must be off-screen above`);
});

test("traffic that somehow escapes far ahead is culled", () => {
  const state = makeState();
  state.traffic = [{ lane: 0, d: state.distance + 5000, passed: false }];

  Racer.step(state);

  assert.deepEqual(state.traffic, [], "escapees must not clog the spawn cap");
});

test("traffic keeps its lane through curves — cars follow the road", () => {
  // The second bug the test driver found: cars stored at an absolute x
  // stayed put while the road curved out from under them, parking them
  // on the grass. A car's lane is RELATIVE to the centerline.
  const state = makeState();
  state.road = [0, 120, 120, 120]; // a hard right after the straight start
  const car = { lane: 0, d: 600, passed: false }; // mid-curve, center lane

  assert.equal(Racer.trafficX(state, car), Racer.centerAt(state, 600));
  assert.notEqual(
    Racer.trafficX(state, car),
    state.width / 2,
    "the road has moved — so has the car"
  );
});
