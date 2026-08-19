// Tuning values. The bird holds its screen column; the WORLD scrolls
// (Racer's trick, upright). Gravity is merciless by design — that IS the
// game.

export const SKY = { width: 480, height: 640 };

export const DT = 1 / 120;

export const GROUND = 80; // the fatal strip at the bottom

export const BIRD = {
  x: 140, // the bird's fixed screen column
  r: 12,
  gravity: 1500, // units/s² — heavy on purpose
  flap: -420, // the impulse: velocity is SET to this, not added
  maxFall: 560,
};

export const PIPES = {
  width: 64,
  gap: 150, // the classic squeeze; the setting scales it
  spacing: 260, // world units between pipes
  speed: 160, // scroll, units/s
  margin: 90, // gap centers keep this far from sky and ground
};
