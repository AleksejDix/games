// Tuning values. The copter holds its column; the CAVE scrolls (Racer's
// world, turned into a tunnel) and slowly closes in.

export const CAVE = { width: 480, height: 360 };

export const DT = 1 / 120;

export const SHIP = {
  x: 120, // the copter's fixed screen column
  r: 10,
  lift: 620, // thrust while held, units/s²
  gravity: 480, // pull while released
  maxV: 300,
};

export const SCROLL = { speed: 180 };

export const TUNNEL = {
  segment: 240, // world units between centerline control points
  wander: 70, // how far the centerline may drift
  lookahead: 700,
  gapStart: 110, // half-height of the tunnel at the start...
  gapMin: 52, // ...and its floor, far in
};
