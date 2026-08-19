// Tuning values. Nine holes, thirty seconds, and a mallet.

export const DT = 1 / 120;

export const WHAC = {
  holes: 9, // a 3×3 lawn
  time: 30, // seconds on the clock — the only opponent
  rate: 1.2, // average pops per second (the difficulty setting scales this)
  upTicks: 140, // how long a mole dares to stay up (~1.2s)
  points: 10,
};
