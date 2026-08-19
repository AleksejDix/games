// One tick of Asteroids.
//
// Input is an object: { turn: -1..1, thrust: 0..1, fire: bool }. The new
// physics idea over Pong/Breakout is INERTIA — input steers a heading and
// fires a thruster, but only momentum moves the ship. Velocity persists
// across ticks; drag and a speed cap keep it flyable.

import { DT, SHIP, BULLET, ASTEROIDS } from "./constants.mjs";
import { rock, spawnWave } from "./state.mjs";
import { transition } from "./machine.mjs";
import { clamp, wrap } from "../../../shared/math.mjs";

// Re-exported for state.mjs and anyone reading the barrel — the torus
// arithmetic itself now lives with the other math mechanisms.
export { wrap };

// Circle-vs-circle, ON THE TORUS: each axis measures the short way
// around, so a rock straddling a seam is exactly as deadly — and as
// hittable — on its wrapped side as on its visible one. Positions wrap
// (above), so plain Euclidean distance would read a 4-unit gap across
// the seam as the width of the whole field, making every edge soft
// cover. Squared on both sides, no square root paid.
function hits(a, b, r, width, height) {
  let dx = Math.abs(a.x - b.x);
  let dy = Math.abs(a.y - b.y);
  dx = Math.min(dx, width - dx);
  dy = Math.min(dy, height - dy);
  return dx * dx + dy * dy <= r * r;
}

export function step(state, input = {}) {
  // ready: space stands still until the first touch of the controls —
  // turn, thrust, or fire starts the field drifting for real.
  if (state.status === "ready" && (input.turn || input.thrust || input.fire)) {
    transition(state, "playing");
  }
  if (state.status !== "playing") return [];
  state.tick += 1;

  const events = [];
  const ship = state.ship;

  // Timers tick first (Snake's ttl discipline: time passes before motion).
  if (state.cooldown > 0) state.cooldown -= 1;
  if (state.invulnerable > 0) state.invulnerable -= 1;

  // --- steer, thrust, drag, cap ---------------------------------------------
  const turn = clamp(input.turn ?? 0, -1, 1);
  ship.angle += turn * SHIP.turnSpeed * DT;

  const push = clamp(input.thrust ?? 0, 0, 1);
  state.thrusting = push > 0; // for the renderer's flame — cosmetic state
  if (push > 0) {
    ship.vx += Math.cos(ship.angle) * SHIP.thrust * push * DT;
    ship.vy += Math.sin(ship.angle) * SHIP.thrust * push * DT;
  }

  // Real space has no drag; playable space does. Scaling velocity down a
  // fraction per tick means the ship eventually coasts to a stop.
  const dragFactor = 1 - SHIP.drag * DT;
  ship.vx *= dragFactor;
  ship.vy *= dragFactor;

  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > SHIP.maxSpeed) {
    ship.vx *= SHIP.maxSpeed / speed;
    ship.vy *= SHIP.maxSpeed / speed;
  }

  // --- fire ------------------------------------------------------------------
  if (input.fire && state.cooldown === 0 && state.bullets.length < BULLET.max) {
    state.bullets.push({
      x: ship.x + Math.cos(ship.angle) * SHIP.radius, // from the nose
      y: ship.y + Math.sin(ship.angle) * SHIP.radius,
      vx: Math.cos(ship.angle) * BULLET.speed,
      vy: Math.sin(ship.angle) * BULLET.speed,
      ttl: BULLET.ttl, // range as lifetime, counted in ticks
    });
    state.cooldown = BULLET.cooldown;
    events.push({ type: "fired" });
  }

  // --- everything moves, everything wraps -------------------------------------
  ship.x = wrap(ship.x + ship.vx * DT, state.width);
  ship.y = wrap(ship.y + ship.vy * DT, state.height);

  for (const b of state.bullets) {
    b.x = wrap(b.x + b.vx * DT, state.width);
    b.y = wrap(b.y + b.vy * DT, state.height);
  }
  state.bullets = state.bullets.filter((b) => --b.ttl > 0);

  for (const a of state.asteroids) {
    a.x = wrap(a.x + a.vx * DT, state.width);
    a.y = wrap(a.y + a.vy * DT, state.height);
    a.angle += a.spin * DT;
  }

  // --- bullets vs rocks --------------------------------------------------------
  // Backwards iteration so splicing doesn't skip neighbors.
  for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
    const bullet = state.bullets[bi];
    for (let ai = state.asteroids.length - 1; ai >= 0; ai--) {
      const a = state.asteroids[ai];
      if (!hits(bullet, a, ASTEROIDS.radii[a.size] + BULLET.radius, state.width, state.height)) continue;

      state.bullets.splice(bi, 1);
      state.asteroids.splice(ai, 1);
      state.score += ASTEROIDS.points[a.size];
      events.push({
        type: "asteroidHit",
        size: a.size,
        points: ASTEROIDS.points[a.size],
      });
      // The split: a rock breaks into two of the next size down; the
      // smallest size just vanishes. Children keep the spot, not the
      // heading — fresh random directions make the field scatter.
      if (a.size > 1) {
        state.asteroids.push(rock(state, a.size - 1, a), rock(state, a.size - 1, a));
      }
      break; // this bullet is spent
    }
  }

  // Field cleared → the next wave rolls in, one rock bigger. Waves are a
  // counter and an event, not a state — play never pauses.
  if (state.asteroids.length === 0) {
    state.wave += 1;
    state.asteroids = spawnWave(state, state.startAsteroids + state.wave - 1);
    events.push({ type: "wave", number: state.wave });
  }

  // --- rocks vs ship -------------------------------------------------------------
  if (state.invulnerable === 0) {
    for (const a of state.asteroids) {
      if (!hits(ship, a, ASTEROIDS.radii[a.size] + SHIP.radius, state.width, state.height)) continue;

      state.lives -= 1;
      if (state.lives <= 0) {
        transition(state, "gameover");
        events.push({ type: "died" });
      } else {
        // Back to center, momentum gone, shield up. The rock that hit us
        // keeps flying — classic behavior, and the shield covers the
        // overlap until it drifts away.
        ship.x = state.width / 2;
        ship.y = state.height / 2;
        ship.vx = 0;
        ship.vy = 0;
        ship.angle = -Math.PI / 2;
        state.invulnerable = SHIP.spawnShield;
        events.push({ type: "shipHit", livesLeft: state.lives });
      }
      break;
    }
  }

  return events;
}
