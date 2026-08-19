// The shape of the world, plus rock spawning.

import { SPACE, SHIP, ASTEROIDS, LIVES } from "./constants.mjs";
import { wrap } from "./step.mjs";

// A new rock. It appears on a RING around the ship — always a safe
// distance away, so spawning needs no rejection sampling (Snake taught us
// where while(true) placement ends: see its full-board bug).
// shape is cosmetic-but-deterministic data: radius multipliers for the
// renderer's jagged outline, rolled once here so the rock keeps its look.
export function spawnAsteroid(state, size) {
  const ringAngle = state.random() * Math.PI * 2;
  const ring = ASTEROIDS.spawnRing * Math.min(state.width, state.height);
  return rock(state, size, {
    x: wrap(state.ship.x + Math.cos(ringAngle) * ring, state.width),
    y: wrap(state.ship.y + Math.sin(ringAngle) * ring, state.height),
  });
}

// A rock at an exact spot — used by splitting, where children inherit the
// parent's position but pick fresh headings.
export function rock(state, size, { x, y }) {
  const [lo, hi] = ASTEROIDS.speed[size];
  const speed = lo + state.random() * (hi - lo);
  const heading = state.random() * Math.PI * 2;
  return {
    x,
    y,
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    size, // 3 big → 2 medium → 1 small → gone
    angle: 0,
    spin: (state.random() * 2 - 1) * 1.2, // radians/s, purely for looks
    shape: Array.from(
      { length: ASTEROIDS.vertices },
      () => 0.75 + state.random() * 0.5
    ),
  };
}

export function spawnWave(state, count) {
  return Array.from({ length: count }, () => spawnAsteroid(state, 3));
}

export function createState({
  random = Math.random,
  lives = LIVES,
  startAsteroids = ASTEROIDS.startCount,
  started = false, // true skips ready — thumbnails and tests
} = {}) {
  const state = {
    width: SPACE.width,
    height: SPACE.height,
    random,
    ship: {
      x: SPACE.width / 2,
      y: SPACE.height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2, // facing up
    },
    thrusting: false, // set by step() for the renderer's flame
    bullets: [], // { x, y, vx, vy, ttl }
    asteroids: [],
    cooldown: 0, // ticks until the next shot is allowed
    invulnerable: SHIP.spawnShield, // a fresh game starts shielded too
    lives,
    score: 0,
    wave: 1,
    startAsteroids, // wave n holds startAsteroids + (n - 1) rocks
    status: started ? "playing" : "ready",
  };
  state.asteroids = spawnWave(state, startAsteroids);
  return state;
}
