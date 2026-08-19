// ============================================================================
// Tests for the Space Invaders core — written before the implementation.
//
// The new entity pattern: a FORMATION. Fifty-five invaders move as one
// organism, in discrete lockstep jumps — march sideways, drop and reverse
// at the edge — and the march accelerates as the fleet thins (a rule here;
// in the 1978 cabinet it was a hardware accident: fewer sprites drew
// faster). This suite also pins the cabinet's quirks: ONE laser in the
// air, three bomb types (the "rolling" one aims at you), at most three
// bombs falling, the UFO with its every-15th-shot 300-point secret, the
// death freeze, bunkers chewed from three directions, an extra life at
// 1500.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Invaders from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// random() = 0.5 never beats the per-tick bomb chance (~0.005), so the
// fleet holds its fire unless a test scripts otherwise.
function makeState() {
  return Invaders.createState({ random: fakeRandom(0.5) });
}

const TOTAL = Invaders.FLEET.cols * Invaders.FLEET.rows;

// --- setup ------------------------------------------------------------------

test("a new game: the full 5×11 fleet, bunkers, lives, empty sky", () => {
  const state = makeState();

  assert.equal(TOTAL, 55, "the original fleet: 5 rows of 11");
  assert.equal(state.invaders.length, TOTAL);
  // 4 bunkers of 14 blocks each — the arch shape, not a full 6×3 slab.
  assert.equal(state.blocks.length, 56);
  assert.equal(state.lives, Invaders.LIVES);
  assert.equal(state.wave, 1);
  assert.equal(state.laser, null);
  assert.equal(state.ufo, null);
  assert.equal(state.shots, 0);
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
  assert.equal(state.shots, 1, "shots are counted — the UFO cares");
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
    "one survivor rewinds a much shorter timer than fifty-five"
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

test("1500 points earns the one extra life", () => {
  const state = makeState();
  state.score = 1490;
  state.laser = { x: 74, y: 230 }; // a 10-point kill crosses the line

  const events = Invaders.step(state);

  assert.deepEqual(events, [
    { type: "invaderHit", row: 4, points: 10, remaining: TOTAL - 1 },
    { type: "extraLife" },
  ]);
  assert.equal(state.lives, Invaders.LIVES + 1);

  // Only once — the original awarded a single bonus cannon.
  state.score = 3000;
  state.laser = { x: 74 + Invaders.FLEET.spacingX, y: 230 };
  const again = Invaders.step(state);
  assert.ok(!again.some((e) => e.type === "extraLife"));
});

// --- bunkers ---------------------------------------------------------------------

test("the laser chews a block off a bunker from below", () => {
  const state = makeState();
  const total = state.blocks.length;
  // First bunker (center 120, origin 84) — aim up into its left column.
  state.laser = { x: 90, y: 507 };

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "bunkerHit" }]);
  assert.equal(state.blocks.length, total - 1);
  assert.equal(state.laser, null);
});

test("bombs chew blocks off from above", () => {
  const state = makeState();
  const total = state.blocks.length;
  state.bombs = [{ x: 90, y: 486, kind: "plunger" }];

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "bunkerHit" }]);
  assert.equal(state.blocks.length, total - 1);
  assert.deepEqual(state.bombs, [], "the bomb is spent");
});

test("the descending fleet chews bunkers too", () => {
  const state = makeState();
  const total = state.blocks.length;
  state.fleet.y = 340; // the bottom row now overlaps the bunker band

  Invaders.step(state);

  assert.ok(state.blocks.length < total, "blocks under the fleet are gone");
});

// --- bombs ------------------------------------------------------------------------

test("a rolling bomb aims at the column nearest the cannon", () => {
  const state = makeState(); // cannon at x 300
  // chance roll beats ~0.005; kind roll 0.0 picks "rolling" (aimed).
  state.random = fakeRandom(0.0001, 0.0);

  Invaders.step(state);

  assert.equal(state.bombs.length, 1);
  assert.equal(state.bombs[0].kind, "rolling");
  // Column centers sit at 74 + 40·col; col 6 (314) is nearest to 300.
  assert.equal(state.bombs[0].x, 314);
});

test("other bombs drop from the bottom of a random column", () => {
  const state = makeState();
  // chance roll; kind roll 0.4 → index 1 ("plunger"); column roll 0.0 →
  // survivor 0 (col 0), whose bottom-most invader is row 4.
  state.random = fakeRandom(0.0001, 0.4, 0.0);

  Invaders.step(state);

  assert.equal(state.bombs.length, 1);
  assert.equal(state.bombs[0].kind, "plunger");
  assert.equal(state.bombs[0].x, 74, "under column 0's center");
  assert.ok(state.bombs[0].y > 244, "released below row 4, already falling");
});

test("at most three bombs fall at once — the cabinet's cap", () => {
  const state = makeState();
  state.bombs = [
    { x: 50, y: 300, kind: "plunger" },
    { x: 150, y: 300, kind: "plunger" },
    { x: 250, y: 300, kind: "plunger" },
  ];
  state.random = fakeRandom(0.0001, 0.4, 0.0); // would drop, but the sky is full

  Invaders.step(state);

  assert.equal(state.bombs.length, 3);
});

test("the laser can shoot a bomb out of the air", () => {
  const state = makeState();
  state.laser = { x: 300, y: 400 };
  state.bombs = [{ x: 300, y: 395, kind: "plunger" }];

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "bombShot" }]);
  assert.equal(state.laser, null, "both projectiles cancel");
  assert.deepEqual(state.bombs, []);
});

// --- the UFO ------------------------------------------------------------------------

test("the UFO crosses the top on its own timer", () => {
  const state = makeState();
  state.ufoTimer = 1; // random 0.5 → enters from the right

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "ufo" }]);
  assert.ok(state.ufo, "the saucer is out");
  assert.equal(state.ufo.dir, -1);
});

test("the UFO jackpot: 300 points on the 23rd shot, then every 15th", () => {
  const state = makeState();
  state.shots = 23; // the legendary counter players reverse-engineered
  state.ufo = { x: 300, dir: -1 };
  state.laser = { x: 310, y: 52 };

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "ufoHit", points: 300 }]);
  assert.equal(state.score, 300);
  assert.equal(state.ufo, null);
  assert.equal(state.laser, null);
});

test("off-count UFO kills pay from the ordinary table", () => {
  const state = makeState();
  state.shots = 25; // not on the magic count
  state.ufo = { x: 300, dir: -1 };
  state.laser = { x: 310, y: 52 };

  const events = Invaders.step(state);

  assert.equal(events[0].type, "ufoHit");
  assert.ok(events[0].points < 300, "no jackpot off-count");
  assert.equal(events[0].points, Invaders.UFO.values[25 % Invaders.UFO.values.length]);
});

// --- getting hit -------------------------------------------------------------------

test("a bomb hitting the cannon costs a life and freezes the world", () => {
  const state = makeState();
  state.bombs = [{ x: 300, y: 550, kind: "plunger" }];

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "cannonHit", livesLeft: Invaders.LIVES - 1 }]);
  assert.equal(state.lives, Invaders.LIVES - 1);
  // The original paused for a beat on death — a real machine state.
  assert.equal(state.status, "respawning");
  assert.equal(state.respawnTimer, Invaders.CANNON.respawn);
});

test("during the freeze nothing moves; play resumes shielded", () => {
  const state = makeState();
  state.bombs = [{ x: 300, y: 550, kind: "plunger" }];
  Invaders.step(state); // the hit → respawning

  const fleetTimer = state.fleet.timer;
  Invaders.step(state, { move: 1, fire: true });

  assert.equal(state.fleet.timer, fleetTimer, "the march is frozen");
  assert.equal(state.laser, null, "no firing from beyond the grave");
  assert.equal(state.cannon.x, 300, "no moving either");

  state.respawnTimer = 1;
  Invaders.step(state);

  assert.equal(state.status, "playing");
  assert.equal(state.invulnerable, Invaders.CANNON.shield, "back with a shield");
});

test("the shield lets bombs fall past harmlessly", () => {
  const state = makeState();
  state.invulnerable = 10;
  state.bombs = [{ x: 300, y: 550, kind: "plunger" }];

  const events = Invaders.step(state);

  assert.deepEqual(events, []);
  assert.equal(state.lives, Invaders.LIVES);
  assert.equal(state.bombs.length, 1, "the bomb keeps falling");
  assert.equal(state.invulnerable, 9);
});

test("the last life ends the game", () => {
  const state = makeState();
  state.lives = 1;
  state.bombs = [{ x: 300, y: 550, kind: "plunger" }];

  const events = Invaders.step(state);

  assert.deepEqual(events, [{ type: "died", cause: "shot" }]);
  assert.equal(state.status, "gameover");
});

// --- the status machine --------------------------------------------------------

test("the status machine: the death freeze is a real state", () => {
  const state = makeState();

  Invaders.transition(state, "respawning");
  Invaders.transition(state, "playing");
  Invaders.transition(state, "gameover");

  assert.throws(
    () => Invaders.transition(state, "playing"),
    /illegal status change/
  );
});
