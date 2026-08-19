// Tuning values — taken from the ORIGINAL, not guessed: Chromium's
// components/neterror/resources/dino_game/*.ts (BSD-licensed). The
// original thinks in px per FRAME at 60fps on a 600×150 canvas; speeds
// here keep those frame units (6 → 13), and step() converts via
// FPS × DT. Collision boxes are the original's, verbatim: six tight
// boxes running, one ducking, three per cactus, five for the bird —
// the forgiveness players remember IS this geometry.

// The original's 600px-wide frame with an ARCADE-MODE sky: the error
// page runs 600×150, but started fullscreen the original grows the
// canvas and keeps the ground low. 338 ≈ 16:9. LIFT shifts every
// original screen-y down onto the taller court — the tables below stay
// Chromium's verbatim numbers in their native 150-frame.
export const SKY = { width: 600, height: 338 };
export const LIFT = SKY.height - 150;

export const DT = 1 / 120;
export const FPS = 60; // the original's clock — frame units × FPS = px/s

export const GROUND_Y = 140 + LIFT; // the T-rex's feet (bottomPad 10 under them)

export const DINO = {
  x: 50, // startXPos
  w: 44,
  h: 47,
  duckW: 59,
  duckH: 25,
  gravity: 0.6, // px/frame², as shipped
  jump: 10, // base impulse, px/frame — startJump adds speed/10 on top
  drop: 5, // endJump damps a fast rise to this: the short-hop mechanic
  minJump: 30, // a release only counts past this height
  apex: 63, // the soft ceiling (the original's 30px top clearance)
  speedDropCoefficient: 3, // ↓ mid-air: dive at 3× the displacement
  boxes: {
    running: [
      [22, 0, 17, 16],
      [1, 18, 30, 9],
      [10, 35, 14, 8],
      [1, 24, 29, 5],
      [5, 30, 21, 4],
      [9, 34, 15, 4],
    ],
    ducking: [[1, 18, 55, 25]],
  },
};

export const RUN = {
  speed: 6, // px/frame at the first step
  accel: 0.001, // px/frame, per frame
  maxSpeed: 13,
  scorePer: 40, // px per point (the original's 0.025 coefficient)
};

// Obstacle types, verbatim: sizes, ground yPos, when they may appear,
// their gap seeds, and their collision boxes.
export const TYPES = {
  cactusSmall: {
    w: 17, h: 35, y: 105,
    multipleSpeed: 4, minGap: 120, minSpeed: 0,
    boxes: [[0, 7, 5, 27], [4, 0, 6, 34], [10, 4, 7, 14]],
  },
  cactusLarge: {
    w: 25, h: 50, y: 90,
    multipleSpeed: 7, minGap: 120, minSpeed: 0,
    boxes: [[0, 12, 7, 38], [8, 0, 7, 49], [13, 10, 10, 38]],
  },
  pterodactyl: {
    w: 46, h: 40, y: [100, 75, 50], // low (jump), mid (duck), high (run on)
    multipleSpeed: 999, minGap: 150, minSpeed: 8.5,
    speedOffset: 0.8, // birds fly a little faster or slower than the ground
    boxes: [[15, 15, 16, 5], [18, 21, 24, 6], [2, 14, 4, 3], [6, 10, 4, 7], [10, 8, 6, 9]],
  },
};

export const SPAWN = {
  gapCoefficient: 0.6,
  maxGapCoefficient: 1.5,
  maxLength: 3, // cacti bunch up to three wide
  maxDuplication: 2, // never three of the same type in a row
};
