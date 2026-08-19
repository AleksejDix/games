// ============================================================================
// Tests for the Missile Command core — written before the implementation.
//
// The first POINTER game: firing is an ACTION at a point — launch(state,
// x, y) — dispatched from a click, not sampled from held keys. The core
// mechanic is indirection: you never shoot a missile, you detonate a
// fireball where one is ABOUT to be. Blasts grow and fade on a sine
// curve; anything inside dies. Cities don't come back. Waves pause for a
// debrief (a machine state), silos rearm, the rain thickens.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Missiles from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// random() = 0.5 never beats the per-tick launch chance — a quiet sky
// unless a test scripts otherwise.
function makeState() {
  return Missiles.createState({ random: fakeRandom(0.5) });
}

// --- setup ------------------------------------------------------------------

test("a new game: six cities, three armed silos, a wave in the pool", () => {
  const state = makeState();

  assert.equal(state.cities.length, 6);
  assert.ok(state.cities.every((c) => c.alive));
  assert.equal(state.silos.length, 3);
  assert.ok(state.silos.every((s) => s.alive && s.ammo === Missiles.SILOS.ammo));
  assert.equal(state.pool, Missiles.WAVES.firstCount);
  assert.deepEqual(state.missiles, []);
  assert.equal(state.status, "playing");
});

test("createState accepts a custom ammo loadout", () => {
  const state = Missiles.createState({ random: fakeRandom(0.5), ammo: 8 });

  assert.ok(state.silos.every((s) => s.ammo === 8));
});

// --- the crosshair -------------------------------------------------------------

test("the crosshair follows the aim input, clamped to the sky", () => {
  const state = makeState();

  Missiles.step(state, { aim: { x: 100, y: 90 } });
  assert.deepEqual(state.aim, { x: 100, y: 90 });

  Missiles.step(state, { aim: { x: -50, y: 9999 } });
  assert.equal(state.aim.x, 0);
  assert.ok(state.aim.y <= state.height);
});

// --- launching ------------------------------------------------------------------

test("launch() fires from the nearest armed silo", () => {
  const state = makeState();

  const events = Missiles.launch(state, 100, 200);

  assert.deepEqual(events, [{ type: "fired" }]);
  assert.equal(state.silos[0].ammo, Missiles.SILOS.ammo - 1, "silo 0 is closest to x=100");
  assert.equal(state.interceptors.length, 1);
  assert.equal(state.interceptors[0].tx, 100);
  assert.equal(state.interceptors[0].ty, 200);
});

test("an empty silo passes the shot to the next nearest", () => {
  const state = makeState();
  state.silos[0].ammo = 0;

  Missiles.launch(state, 100, 200);

  assert.equal(state.silos[1].ammo, Missiles.SILOS.ammo - 1, "the center silo answers");
});

test("all silos dry: a hollow click, nothing flies", () => {
  const state = makeState();
  for (const s of state.silos) s.ammo = 0;

  const events = Missiles.launch(state, 100, 200);

  assert.deepEqual(events, [{ type: "empty" }]);
  assert.deepEqual(state.interceptors, []);
});

test("launch() outside playing does nothing", () => {
  const state = makeState();
  state.status = "debrief";

  assert.deepEqual(Missiles.launch(state, 100, 200), []);
  assert.equal(state.silos[0].ammo, Missiles.SILOS.ammo);
});

// --- fireballs ------------------------------------------------------------------

test("an interceptor reaching its mark detonates into a blast", () => {
  const state = makeState();
  state.interceptors = [{ sx: 320, sy: 430, x: 300, y: 202, tx: 300, ty: 200, vx: 0, vy: -260 }];

  const events = Missiles.step(state);

  assert.deepEqual(events, [{ type: "boom" }]);
  assert.deepEqual(state.interceptors, []);
  assert.deepEqual(state.blasts, [{ x: 300, y: 200, age: 0 }]);
});

test("a blast swells and fades on a sine — silent at both ends", () => {
  assert.equal(Missiles.blastRadius(0), 0);
  assert.equal(Missiles.blastRadius(Missiles.BLAST.life / 2), Missiles.BLAST.radius);
  assert.ok(Missiles.blastRadius(Missiles.BLAST.life) < 1e-6);
});

test("a missile inside a blast dies and pays", () => {
  const state = makeState();
  state.blasts = [{ x: 300, y: 200, age: Missiles.BLAST.life / 2 }];
  state.missiles = [
    { sx: 310, sy: 0, x: 310, y: 200, vx: 0, vy: 50, kind: "city", index: 0 },
  ];

  const events = Missiles.step(state);

  assert.deepEqual(events, [{ type: "kill", points: Missiles.SCORE.kill }]);
  assert.deepEqual(state.missiles, []);
  assert.equal(state.score, Missiles.SCORE.kill);
});

test("a missile outside the fireball flies on", () => {
  const state = makeState();
  state.blasts = [{ x: 300, y: 200, age: Missiles.BLAST.life / 2 }];
  state.missiles = [
    { sx: 300, sy: 0, x: 300, y: 350, vx: 0, vy: 50, kind: "city", index: 0 },
  ];

  Missiles.step(state);

  assert.equal(state.missiles.length, 1);
});

// --- impacts --------------------------------------------------------------------

test("an ICBM reaching its city destroys it", () => {
  const state = makeState();
  const cityX = state.cities[0].x;
  state.missiles = [
    { sx: cityX, sy: 0, x: cityX, y: Missiles.GROUND - 0.1, vx: 0, vy: 60, kind: "city", index: 0 },
  ];

  const events = Missiles.step(state);

  assert.deepEqual(events, [{ type: "impact", target: "city" }]);
  assert.equal(state.cities[0].alive, false);
  assert.deepEqual(state.missiles, []);
});

test("a strike on rubble is just a hole in the ground", () => {
  const state = makeState();
  state.cities[0].alive = false;
  const cityX = state.cities[0].x;
  state.missiles = [
    { sx: cityX, sy: 0, x: cityX, y: Missiles.GROUND - 0.1, vx: 0, vy: 60, kind: "city", index: 0 },
  ];

  const events = Missiles.step(state);

  assert.deepEqual(events, [{ type: "impact", target: "ground" }]);
});

// --- the rain -------------------------------------------------------------------

test("ICBMs launch from the pool, aimed at something still standing", () => {
  const state = makeState();
  // chance roll, entry x, target pick (index 0 → the first city).
  state.random = fakeRandom(0.0001, 0.5, 0.0);

  Missiles.step(state);

  assert.equal(state.missiles.length, 1);
  assert.equal(state.pool, Missiles.WAVES.firstCount - 1);
  const m = state.missiles[0];
  assert.ok(m.vy > 0, "falling");
  assert.equal(m.kind, "city");
});

// --- waves ----------------------------------------------------------------------

test("a survived wave pays a bonus and enters the debrief", () => {
  const state = makeState();
  state.pool = 0; // the sky is clear and the pool is spent

  const events = Missiles.step(state);

  const bonus =
    3 * Missiles.SILOS.ammo * Missiles.SCORE.ammoBonus +
    6 * Missiles.SCORE.cityBonus;
  assert.deepEqual(events, [{ type: "waveEnd", bonus, cities: 6 }]);
  assert.equal(state.score, bonus);
  assert.equal(state.status, "debrief");
  assert.equal(state.debriefTimer, Missiles.DEBRIEF);
});

test("the debrief ends into a bigger, rearmed wave", () => {
  const state = makeState();
  state.status = "debrief";
  state.debriefTimer = 1;
  state.silos[0].ammo = 2;
  state.silos[1].alive = false;

  const events = Missiles.step(state);

  assert.deepEqual(events, [{ type: "wave", number: 2 }]);
  assert.equal(state.status, "playing");
  assert.equal(state.pool, Missiles.WAVES.firstCount + Missiles.WAVES.addPerWave);
  assert.ok(
    state.silos.every((s) => s.alive && s.ammo === Missiles.SILOS.ammo),
    "silos are rebuilt and rearmed — cities are not"
  );
});

test("total annihilation mid-wave still ends the game — no target, no launch, no lock", () => {
  // Regression: the rain only launches at standing targets, so with every
  // city AND silo dead while the pool held rounds, nothing ever launched,
  // pool never reached 0, and the wave-end check never fired — the game
  // sat in "playing" forever, refusing even Enter-restart.
  const state = makeState();
  for (const c of state.cities) c.alive = false;
  for (const s of state.silos) s.alive = false;
  assert.ok(state.pool > 0, "the pool still holds unlaunched rounds");

  const events = Missiles.step(state);

  assert.deepEqual(events, [
    { type: "waveEnd", bonus: 0, cities: 0 },
    { type: "died" },
  ]);
  assert.equal(state.status, "gameover");
});

test("wave end waits for the last fireball to fade", () => {
  const state = makeState();
  state.pool = 0;
  state.blasts = [{ x: 300, y: 200, age: 0 }];

  assert.deepEqual(Missiles.step(state), [], "still swelling — no debrief yet");
  assert.equal(state.status, "playing");

  state.blasts = [];
  const events = Missiles.step(state);
  assert.equal(events[0].type, "waveEnd");
  assert.equal(state.status, "debrief");
});

test("no cities left at wave end: the end", () => {
  const state = makeState();
  state.pool = 0;
  for (const c of state.cities) c.alive = false;

  const events = Missiles.step(state);

  const bonus = 3 * Missiles.SILOS.ammo * Missiles.SCORE.ammoBonus;
  assert.deepEqual(events, [
    { type: "waveEnd", bonus, cities: 0 },
    { type: "died" },
  ]);
  assert.equal(state.status, "gameover");
});

// --- the status machine --------------------------------------------------------

test("the status machine: playing ⇄ debrief, and one true ending", () => {
  const state = makeState();

  Missiles.transition(state, "debrief");
  Missiles.transition(state, "playing");
  Missiles.transition(state, "gameover");

  assert.throws(
    () => Missiles.transition(state, "playing"),
    /illegal status change/
  );
});
