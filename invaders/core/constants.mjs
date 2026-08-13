// Tuning values. A tall court: fleet up top, cannon pinned to the bottom
// rail, bunkers between them. Speeds are units/second (via DT); the march
// interval is seconds between JUMPS — the fleet moves discretely, like
// Snake, while lasers and bombs fly continuously, like Pong. Both time
// models in one game.

export const COURT = { width: 600, height: 600 };

export const DT = 1 / 120;

export const CANNON = {
  width: 36,
  height: 16,
  speed: 260,
  y: 560, // center of the cannon's fixed rail
  shield: 180, // ticks of grace after being hit — bombs keep raining
};

export const LASER = { speed: 420, width: 3, height: 12 };

export const FLEET = {
  cols: 10,
  rows: 5,
  spacingX: 44,
  spacingY: 36,
  width: 28, // one invader's hitbox
  height: 20,
  top: 80, // formation origin on wave 1
  left: 60,
  stepX: 8, // one march jump
  dropY: 18, // one drop row at the edge
  margin: 10, // how close to the walls the fleet may swing
  // Seconds between jumps: full fleet → last survivor. The famous
  // speed-up-as-they-die was a hardware accident in 1978 (fewer sprites
  // drew faster); here it's a rule, linearly interpolated.
  interval: { start: 0.7, end: 0.06 },
  // Points by row — the top row is furthest and pays the most.
  points: { 0: 30, 1: 20, 2: 20, 3: 10, 4: 10 },
};

export const BOMBS = {
  speed: 160,
  width: 4,
  height: 10,
  rate: 0.6, // average bombs per second from the whole fleet
};

export const BUNKERS = { count: 3, cols: 6, rows: 3, block: 12, y: 480 };

export const LIVES = 3;
