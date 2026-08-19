// ============================================================================
// Tests for the Chrome Dino core. The numbers are the ORIGINAL's —
// Chromium's dino_game sources — so these tests pin fidelity as much as
// correctness: frame-unit speeds (6 → 13), the 40px-per-point score, the
// altitude table {100, 75, 50}, and the original's two-stage collision
// with its tight per-part boxes (the forgiveness players remember).
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Dino from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

function makeState() {
  return Dino.createState({ random: fakeRandom(0.5), started: true });
}

// A far-away sentinel with an endless gap keeps the spawner quiet and
// the lane clear for hand-placed scenarios.
const clearLane = (state) => {
  state.obstacles = [{
    x: state.distance + 5000, y: 105, w: 17, h: 35,
    type: "cactusSmall", size: 1, gap: 1e9, speedOffset: 0,
  }];
};

const cactusAt = (state, x) => ({
  x, y: 105 + Dino.LIFT, w: 17, h: 35, type: "cactusSmall", size: 1, gap: 1e9, speedOffset: 0,
});
const birdAt = (state, x, y) => ({
  x, y: y + Dino.LIFT, w: 46, h: 40, type: "pterodactyl", size: 1, gap: 1e9, speedOffset: 0,
});

// --- setup ------------------------------------------------------------------

test("a new game: grounded T-rex, obstacles already past the horizon", () => {
  const state = Dino.createState({ random: fakeRandom(0.5) });

  assert.equal(state.status, "ready");
  assert.equal(state.dino.elev, 0);
  assert.equal(state.speed, Dino.RUN.speed, "the original's opening 6");
  assert.ok(state.obstacles.length > 0, "the future is visible");
  assert.ok(
    state.obstacles[0].x >= Dino.SKY.width,
    "but nothing spawns on top of the T-rex"
  );
});

test("ready: the desert stands frozen until the first jump — which also leaps", () => {
  const state = Dino.createState({ random: fakeRandom(0.5) });

  assert.deepEqual(Dino.step(state, {}), [], "no run yet");
  assert.equal(state.distance, 0, "not a step taken");

  const events = Dino.step(state, { jump: true });
  assert.equal(state.status, "playing");
  assert.ok(events.some((e) => e.type === "jumped"), "the starting touch is the leap");
  assert.ok(state.dino.elev > 0, "airborne already");
});

// --- the run ----------------------------------------------------------------

test("the desert scrolls and hurries, up to the original's 13", () => {
  const state = makeState();
  clearLane(state);

  Dino.step(state, {});
  assert.ok(state.distance > 0, "the world moved");
  assert.ok(state.speed > Dino.RUN.speed, "and it is speeding up");

  state.speed = Dino.RUN.maxSpeed;
  Dino.step(state, {});
  assert.equal(state.speed, Dino.RUN.maxSpeed, "the cap holds");
});

test("gravity ends every jump on the ground, never below it", () => {
  const state = makeState();
  clearLane(state);

  Dino.step(state, { jump: true });
  assert.ok(state.dino.elev > 0);
  assert.deepEqual(Dino.step(state, { jump: true }), [], "no double jump mid-air");

  for (let i = 0; i < 300; i++) Dino.step(state, {});
  assert.equal(state.dino.elev, 0, "back on the ground exactly");
});

test("holding down mid-air is the speed drop — a much harder fall", () => {
  const a = makeState();
  clearLane(a);
  const b = makeState();
  clearLane(b);

  Dino.step(a, { jump: true });
  Dino.step(b, { jump: true });
  for (let i = 0; i < 20; i++) {
    Dino.step(a, {});
    Dino.step(b, { duck: true });
  }

  assert.ok(b.dino.elev < a.dino.elev, "the ducker comes down sooner");
});

test("obstacles chain by their own gaps and are forgotten behind", () => {
  const state = makeState();
  const first = state.obstacles[0];

  // The next enters once the first, plus its own gap, is inside the screen.
  state.distance = first.x + first.w + first.gap - Dino.SKY.width + 10;
  Dino.extendObstacles(state);
  const second = state.obstacles[1];
  assert.equal(second.x, first.x + first.w + first.gap, "the gap IS the spacing");

  state.distance = second.x + 200; // long past both
  Dino.step(state, {});

  assert.ok(state.obstacles[0].x > first.x, "the passed cactus is gone");
  const last = state.obstacles.at(-1);
  assert.ok(
    last.x + last.w + last.gap >= state.distance + Dino.SKY.width,
    "and the horizon stays stocked"
  );
});

// --- collisions -------------------------------------------------------------

test("running into a cactus is the end", () => {
  const state = makeState();
  state.obstacles = [cactusAt(state, state.distance + Dino.DINO.x - 5)];

  const events = Dino.step(state, {});

  assert.ok(events.some((e) => e.type === "died"));
  assert.equal(state.status, "gameover");
});

test("a jump clears what a run cannot", () => {
  const state = makeState();
  state.dino.elev = 60; // mid-leap, above a 35-tall cactus
  state.dino.vy = 0;
  state.obstacles = [cactusAt(state, state.distance + Dino.DINO.x - 5)];

  const events = Dino.step(state, {});

  assert.ok(!events.some((e) => e.type === "died"));
  assert.equal(state.status, "playing");
});

test("the mid bird (y 75) punishes standing and rewards the duck", () => {
  const standing = makeState();
  standing.obstacles = [birdAt(standing, standing.distance + 40, 75)];
  assert.ok(
    Dino.step(standing, {}).some((e) => e.type === "died"),
    "standing tall is fatal"
  );

  const ducking = makeState();
  ducking.obstacles = [birdAt(ducking, ducking.distance + 40, 75)];
  const events = Dino.step(ducking, { duck: true });
  assert.ok(!events.some((e) => e.type === "died"), "the duck slips under");
  assert.equal(ducking.status, "playing");
});

test("the high bird (y 50) is survived by doing nothing at all", () => {
  const state = makeState();
  state.obstacles = [birdAt(state, state.distance + 40, 50)];

  const events = Dino.step(state, {});

  assert.ok(!events.some((e) => e.type === "died"));
  assert.equal(state.status, "playing");
});

test("birds join only past the original's speed 8.5", () => {
  const slow = makeState();
  slow.speed = 7;
  slow.lastType = null;
  // random 0.66.. would pick index 2 — the pterodactyl — if it were legal.
  slow.random = fakeRandom(0.7);
  Dino.extendObstacles(slow);
  assert.ok(
    slow.obstacles.every((o) => o.type !== "pterodactyl"),
    "too slow for wings"
  );
});

// --- score ------------------------------------------------------------------

test("every hundredth point is a milestone — the famous beep", () => {
  const state = makeState();
  clearLane(state);
  state.distance = 3999; // 40px a point: one tick from point 100
  state.score = 99;

  const events = Dino.step(state, {});

  assert.ok(
    events.some((e) => e.type === "milestone" && e.value === 100),
    "the century announces itself"
  );
});

// --- the status machine -----------------------------------------------------

test("the status machine: one way through the desert", () => {
  const state = makeState();
  Dino.transition(state, "gameover");
  assert.throws(() => Dino.transition(state, "playing"), /illegal status change/);
});
