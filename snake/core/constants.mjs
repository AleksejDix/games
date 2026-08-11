// Tuning values and shared vocabulary for the whole core.
// Numbers a game designer might tweak live here, not buried in logic.

// The four movement directions as unit vectors.
export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// The bonus food. Its lifetime is measured in TICKS, not milliseconds —
// pure logic has no clock. The shell decides how long a tick lasts, so at
// the starting speed (130ms/tick) 40 ticks ≈ 5 real seconds.
export const BONUS = {
  every: 5, // a bonus appears after every 5th food...
  ttl: 40, // ...lives this many ticks...
  points: 5, // ...and is worth this many points
};
