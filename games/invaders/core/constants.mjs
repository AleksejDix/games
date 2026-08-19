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
  respawn: 90, // ticks the world FREEZES after a hit — the original's death pause
  shield: 90, // ticks of grace once play resumes
};

export const LASER = { speed: 420, width: 3, height: 12 };

export const FLEET = {
  cols: 11, // the original formation: 5 rows of 11 = 55
  rows: 5,
  spacingX: 40,
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
  width: 4,
  height: 10,
  rate: 0.6, // average bombs per second from the whole fleet
  max: 3, // at most three falling at once — the cabinet's cap
  // The original's three bomb types. "rolling" AIMS at the cannon's
  // column; the others pick a random column. Each falls at its own pace.
  kinds: ["rolling", "plunger", "squiggly"],
  speed: { rolling: 140, plunger: 170, squiggly: 200 },
};

export const BUNKERS = {
  count: 4, // the original had four
  block: 12,
  y: 480,
  // The bunker silhouette as string art: '#' is a block. Sloped shoulders
  // on top, the archway at the bottom — the shape players hide under.
  shape: [
    " #### ",
    "######",
    "##  ##",
  ],
};

// The mystery ship. Its famous secret: the 300-point jackpot is not
// random — it pays on the 23rd shot FIRED, then every 15th after, a
// counter players reverse-engineered in arcades. Off-count kills pay
// from the ordinary table, cycled by shot count.
export const UFO = {
  width: 32,
  height: 14,
  y: 40,
  speed: 85,
  interval: 25, // seconds between visits
  minFleet: 8, // the saucer stays home once the fleet runs thin
  jackpot: 300,
  values: [50, 100, 150],
};

export const EXTRA_LIFE_AT = 1500; // one bonus cannon, like the cabinet

export const LIVES = 3;
