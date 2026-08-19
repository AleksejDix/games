// ============================================================================
// Tests for the Asteroids core — written before the implementation.
//
// The new physics family: ROTATION and INERTIA. The ship is not a paddle —
// input steers a heading and fires a thruster; momentum does the rest.
// Space is a torus (Snake's wrap-around, in floats), timers are ticks
// (Snake's ttl trick: bullet lifetime, fire cooldown, spawn shield), and
// collisions are circle-vs-circle — one Pythagoras for everything.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Asteroids from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// Spawning never rejection-samples (rocks appear on a ring around the
// ship), so a cycling constant random is always safe.
function makeState() {
  return Asteroids.createState({ random: fakeRandom(0.5), started: true }); // these tests are about play
}

// --- setup ------------------------------------------------------------------

test("a new game: one wave of rocks, full lives, and a spawn shield", () => {
  const state = makeState();

  assert.equal(state.asteroids.length, Asteroids.ASTEROIDS.startCount);
  assert.ok(state.asteroids.every((a) => a.size === 3), "waves start with big rocks");
  assert.equal(state.lives, Asteroids.LIVES);
  assert.equal(state.wave, 1);
  assert.deepEqual(state.bullets, []);
  assert.ok(state.invulnerable > 0, "the ship spawns shielded");
  assert.equal(state.status, "playing");
});

test("createState accepts custom lives and wave size", () => {
  const state = Asteroids.createState({
    random: fakeRandom(0.5),
    lives: 5,
    startAsteroids: 6,
  });

  assert.equal(state.lives, 5);
  assert.equal(state.asteroids.length, 6);
});

// --- flying -----------------------------------------------------------------

test("turning changes the heading, not the position", () => {
  const state = makeState();
  const { x, y } = state.ship;

  Asteroids.step(state, { turn: 1 });

  assert.equal(
    state.ship.angle,
    -Math.PI / 2 + Asteroids.SHIP.turnSpeed * Asteroids.DT
  );
  assert.equal(state.ship.x, x, "turning alone does not move the ship");
  assert.equal(state.ship.y, y);
});

test("thrust accelerates along the heading", () => {
  const state = makeState();
  state.ship.angle = 0; // facing +x

  Asteroids.step(state, { thrust: 1 });

  assert.ok(state.ship.vx > 0, "gains speed along the facing");
  assert.equal(state.ship.vy, 0, "and none sideways");
});

test("velocity decays with drag when the thruster is off", () => {
  const state = makeState();
  state.ship.vx = 100;

  Asteroids.step(state);

  assert.ok(state.ship.vx < 100, "drag bleeds speed");
  assert.ok(state.ship.vx > 98, "but only a little per tick");
});

test("speed is capped", () => {
  const state = makeState();
  state.ship.vx = 10000;

  Asteroids.step(state, { thrust: 1 });

  const speed = Math.hypot(state.ship.vx, state.ship.vy);
  assert.ok(speed <= Asteroids.SHIP.maxSpeed + 1e-9, `speed ${speed} over cap`);
});

test("space is a torus — the ship wraps across the edge", () => {
  const state = makeState();
  state.ship.x = state.width - 1;
  state.ship.vx = 240;

  Asteroids.step(state);

  assert.ok(state.ship.x < 5, "re-entered on the left");
});

test("asteroids drift and wrap too", () => {
  const state = makeState();
  state.asteroids = [
    { x: state.width - 1, y: 100, vx: 240, vy: 0, size: 3, angle: 0, spin: 0, shape: [1] },
  ];

  Asteroids.step(state);

  assert.ok(state.asteroids[0].x < 5);
});

// --- shooting ---------------------------------------------------------------

test("firing spawns one bullet from the nose, with a cooldown", () => {
  const state = makeState();

  const first = Asteroids.step(state, { fire: true });
  const second = Asteroids.step(state, { fire: true });

  assert.deepEqual(first, [{ type: "fired" }]);
  assert.deepEqual(second, [], "cooldown swallows the second shot");
  assert.equal(state.bullets.length, 1);
  assert.ok(state.bullets[0].y < state.ship.y, "bullet leaves from the nose (facing up)");
  assert.ok(state.bullets[0].vy < 0, "and flies that way");
});

test("at most BULLET.max bullets are in flight", () => {
  const state = makeState();
  state.bullets = Array.from({ length: Asteroids.BULLET.max }, () => ({
    x: 600, y: 400, vx: 0, vy: 0, ttl: 100,
  }));
  state.cooldown = 0;

  const events = Asteroids.step(state, { fire: true });

  assert.deepEqual(events, []);
  assert.equal(state.bullets.length, Asteroids.BULLET.max);
});

test("bullets expire after their ttl in ticks", () => {
  const state = makeState();
  // One far-away rock keeps the field non-empty (an empty field spawns a wave).
  state.asteroids = [{ x: 600, y: 400, vx: 0, vy: 0, size: 3, angle: 0, spin: 0, shape: [1] }];
  state.bullets = [{ x: 50, y: 50, vx: 0, vy: 0, ttl: 1 }];

  Asteroids.step(state);

  assert.equal(state.bullets.length, 0, "ttl 1 → gone this tick");
});

// --- rocks ------------------------------------------------------------------

test("a bullet splits a big rock into two mediums and scores", () => {
  const state = makeState();
  const spare = { x: 600, y: 400, vx: 0, vy: 0, size: 3, angle: 0, spin: 0, shape: [1] };
  state.asteroids = [
    { x: 100, y: 100, vx: 0, vy: 0, size: 3, angle: 0, spin: 0, shape: [1] },
    spare,
  ];
  state.bullets = [{ x: 100, y: 100, vx: 0, vy: 0, ttl: 50 }];

  const events = Asteroids.step(state);

  assert.deepEqual(events, [
    { type: "asteroidHit", size: 3, points: Asteroids.ASTEROIDS.points[3] },
  ]);
  assert.equal(state.score, Asteroids.ASTEROIDS.points[3]);
  assert.equal(state.bullets.length, 0, "the bullet is spent");
  const sizes = state.asteroids.map((a) => a.size).sort();
  assert.deepEqual(sizes, [2, 2, 3], "two mediums plus the untouched spare");
});

test("the seam is not cover: a bullet hits a rock across the wrap", () => {
  // Regression: collisions used plain Euclidean distance on wrapped
  // positions, so a 4-unit gap across the seam read as the width of the
  // whole field — a rock straddling an edge was unhittable from the
  // other side, and every edge was exploitable soft cover.
  const state = makeState();
  const spare = { x: 300, y: 240, vx: 0, vy: 0, size: 3, angle: 0, spin: 0, shape: [1] };
  state.asteroids = [
    { x: state.width - 2, y: 100, vx: 0, vy: 0, size: 3, angle: 0, spin: 0, shape: [1] },
    spare,
  ];
  state.bullets = [{ x: 2, y: 100, vx: 0, vy: 0, ttl: 50 }]; // 4 units away, around the back

  const events = Asteroids.step(state);

  assert.ok(events.some((e) => e.type === "asteroidHit"), "hit through the seam");
  assert.equal(state.bullets.length, 0, "the bullet is spent");
});

test("a rock reaches the ship across the seam too", () => {
  const state = makeState();
  state.invulnerable = 0;
  state.ship.x = 1;
  state.ship.y = 240;
  state.asteroids = [
    { x: state.width - 1, y: 240, vx: 0, vy: 0, size: 3, angle: 0, spin: 0, shape: [1] },
  ];

  const events = Asteroids.step(state);

  assert.ok(events.some((e) => e.type === "shipHit"), "no hiding at the edge");
});

test("the smallest rock just dies", () => {
  const state = makeState();
  const spare = { x: 600, y: 400, vx: 0, vy: 0, size: 3, angle: 0, spin: 0, shape: [1] };
  state.asteroids = [
    { x: 100, y: 100, vx: 0, vy: 0, size: 1, angle: 0, spin: 0, shape: [1] },
    spare,
  ];
  state.bullets = [{ x: 100, y: 100, vx: 0, vy: 0, ttl: 50 }];

  Asteroids.step(state);

  assert.deepEqual(state.asteroids, [spare]);
});

test("clearing the field spawns the next, bigger wave", () => {
  const state = makeState();
  state.asteroids = [
    { x: 100, y: 100, vx: 0, vy: 0, size: 1, angle: 0, spin: 0, shape: [1] },
  ];
  state.bullets = [{ x: 100, y: 100, vx: 0, vy: 0, ttl: 50 }];

  const events = Asteroids.step(state);

  assert.deepEqual(events, [
    { type: "asteroidHit", size: 1, points: Asteroids.ASTEROIDS.points[1] },
    { type: "wave", number: 2 },
  ]);
  assert.equal(state.wave, 2);
  assert.equal(
    state.asteroids.length,
    state.startAsteroids + 1,
    "each wave adds one more rock"
  );
});

// --- crashing ---------------------------------------------------------------

test("a rock hitting the ship costs a life and re-spawns it shielded", () => {
  const state = makeState();
  state.invulnerable = 0;
  state.ship.vx = 123;
  state.asteroids = [
    { x: state.ship.x, y: state.ship.y, vx: 0, vy: 0, size: 1, angle: 0, spin: 0, shape: [1] },
  ];

  const events = Asteroids.step(state);

  assert.deepEqual(events, [{ type: "shipHit", livesLeft: Asteroids.LIVES - 1 }]);
  assert.equal(state.lives, Asteroids.LIVES - 1);
  assert.equal(state.ship.x, state.width / 2, "back to center");
  assert.equal(state.ship.vx, 0, "momentum cleared");
  assert.equal(state.invulnerable, Asteroids.SHIP.spawnShield, "shield restored");
});

test("the spawn shield prevents the crash", () => {
  const state = makeState();
  state.invulnerable = 10;
  state.asteroids = [
    { x: state.ship.x, y: state.ship.y, vx: 0, vy: 0, size: 1, angle: 0, spin: 0, shape: [1] },
  ];

  const events = Asteroids.step(state);

  assert.deepEqual(events, []);
  assert.equal(state.lives, Asteroids.LIVES);
  assert.equal(state.invulnerable, 9, "the shield ticks down");
});

test("losing the last life ends the game", () => {
  const state = makeState();
  state.invulnerable = 0;
  state.lives = 1;
  state.asteroids = [
    { x: state.ship.x, y: state.ship.y, vx: 0, vy: 0, size: 1, angle: 0, spin: 0, shape: [1] },
  ];

  const events = Asteroids.step(state);

  assert.deepEqual(events, [{ type: "died" }]);
  assert.equal(state.status, "gameover");
});

// --- the status machine -------------------------------------------------------

test("the status machine: crashing out is the only exit", () => {
  const state = makeState();

  Asteroids.transition(state, "gameover");

  assert.throws(
    () => Asteroids.transition(state, "playing"),
    /illegal status change/
  );
});

test("ready: space stands still until turn, thrust, or fire", () => {
  const state = Asteroids.createState({ random: fakeRandom(0.5) });
  assert.equal(state.status, "ready");
  const rockX = state.asteroids[0].x;

  Asteroids.step(state, {});
  assert.equal(state.asteroids[0].x, rockX, "the field is frozen");

  Asteroids.step(state, { fire: true });
  assert.equal(state.status, "playing");
});
