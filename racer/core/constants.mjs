// Tuning values. A tall court: the car near the bottom, the road pouring
// down toward it. Distances are world units; speeds units/second; the
// clock is real seconds (drained per tick by DT).

export const COURT = { width: 480, height: 640 };

export const DT = 1 / 120;

export const CAR = {
  width: 28,
  height: 44,
  y: 560, // the car's fixed screen row — the WORLD moves, not the car
  steer: 320, // sideways units/s
  shield: 150, // ticks of grace after a crash (~1.25s)
};

export const SPEED = {
  min: 120, // always rolling — this is a racer, not a parking lot
  max: 520,
  accel: 160, // gas pedal, units/s²
  brake: 340,
  coast: 60, // drag when neither pedal is down
};

export const ROAD = {
  halfWidth: 150,
  segment: 400, // world units between centerline control points
  wander: 80, // how far a control point may drift off center
  lookahead: 800, // world units of road kept generated ahead
};

export const TRAFFIC = {
  width: 28,
  height: 44,
  // Slower than SPEED.min BY DESIGN (there's a test): even a rolling
  // player gains on every car, so traffic always eventually appears.
  // The first version had this at 150 — faster than an idling player —
  // and the road looked empty forever. Found by our first test driver.
  speed: 60,
  rate: 0.9, // average spawns per second
  max: 8,
  spawnAhead: 640, // just past the screen's top edge...
  jitter: 200, // ...spread over a window so arrivals aren't rhythmic
  points: 50, // per car passed
};

export const TIME = {
  start: 45, // seconds on the clock at the flag
  checkpointEvery: 2500, // world units between checkpoints
  checkpointBonus: 12, // seconds a checkpoint refunds
};
