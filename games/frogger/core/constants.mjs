// The crossing, row by row: homes at the top, five river lanes, a
// median to breathe on, five road lanes, and the start curb. The frog
// hops a 40px grid; the lanes flow in continuous pixels.

export const COURT = { width: 480, height: 520 };

export const DT = 1 / 120;

export const CELL = 40;
export const ROWS = 13;

export const HOME_XS = [40, 140, 240, 340, 440]; // bay centers, row 0
export const RIVER_ROWS = [1, 2, 3, 4, 5];
export const ROAD_ROWS = [7, 8, 9, 10, 11];

export const FROG = { r: 14 };
export const LIVES = 3;

// Per-row traffic: direction, speed (units/s), item width, item count.
// Rows alternate direction like the arcade; speeds vary per lane.
export const LANES = {
  1: { dir: 1, speed: 55, w: 120, count: 3 }, // logs
  2: { dir: -1, speed: 75, w: 90, count: 3 },
  3: { dir: 1, speed: 45, w: 150, count: 2 },
  4: { dir: -1, speed: 90, w: 90, count: 3 },
  5: { dir: 1, speed: 65, w: 120, count: 3 },
  7: { dir: -1, speed: 80, w: 60, count: 3 }, // cars
  8: { dir: 1, speed: 55, w: 60, count: 3 },
  9: { dir: -1, speed: 110, w: 60, count: 2 },
  10: { dir: 1, speed: 70, w: 90, count: 2 },
  11: { dir: -1, speed: 60, w: 60, count: 3 },
};

export const SCORE = { hop: 0, home: 50, clear: 200 };
