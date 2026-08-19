// Tuning values. The moon is small and the physics gentle — real lunar
// gravity would be unplayable at this scale. Speeds in units/second,
// angles in radians (ship spawns facing up, -π/2).

export const SKY = { width: 640, height: 480 };

export const DT = 1 / 120;

export const SHIP = {
  radius: 10,
  turnSpeed: 2.4, // radians/s — slower than Asteroids; this is a truck
  thrust: 46, // units/s² — barely 2.5× gravity, so burns must be planned
  gravity: 18, // units/s², always on
  fuel: 400, // the budget — and, on touchdown, the score
  burn: 60, // fuel units per second at full throttle
  maxLandSpeed: 24, // touch the ground faster than this and it's a crater
  maxLandTilt: 0.3, // radians off vertical the struts can absorb
};

export const TERRAIN = {
  points: 24, // ground vertices across the sky
  minY: 300,
  maxY: 440,
  padCount: 2, // segments flattened into landing pads
};
