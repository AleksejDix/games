// Tuning values. Space is a torus: no walls anywhere, everything wraps.
// Angles are radians (0 = facing +x, the canvas convention); speeds are
// units per second, converted per tick via DT; every timer is in TICKS.

export const SPACE = { width: 640, height: 480 };

export const DT = 1 / 120;

export const SHIP = {
  radius: 12, // collision circle — generous to the player, smaller than the drawing
  turnSpeed: 3.6, // radians/s — a full spin in ~1.7s
  thrust: 260, // acceleration, units/s²
  drag: 0.4, // fraction of velocity lost per second — space with training wheels
  maxSpeed: 420,
  spawnShield: 180, // ticks (~1.5s) of invulnerability after (re)spawning
};

export const BULLET = {
  speed: 480,
  ttl: 80, // ticks of flight (~0.7s) — range, expressed as lifetime
  max: 4, // in flight at once, like the arcade original
  cooldown: 18, // ticks between shots
  radius: 2,
};

export const ASTEROIDS = {
  startCount: 4,
  radii: { 3: 40, 2: 22, 1: 11 },
  // Classic scoring: the smaller the rock, the harder to hit, the more it pays.
  points: { 3: 20, 2: 50, 1: 100 },
  speed: { 3: [40, 80], 2: [70, 120], 1: [110, 180] }, // [min, max] per size
  spawnRing: 0.4, // rocks appear on a ring this fraction of space away from the ship
  vertices: 9, // corners of each rock's jagged outline
};

export const LIVES = 3;
