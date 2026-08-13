// The shape of the world: cannon, fleet, bunkers.

import { COURT, FLEET, BUNKERS, BOMBS, LIVES, DT } from "./constants.mjs";

// The fleet as data: invaders keep only their FORMATION SLOT (col, row).
// World positions derive from the shared fleet origin — move one x and
// fifty invaders march in perfect lockstep for free.
export function createFleet() {
  const invaders = [];
  for (let row = 0; row < FLEET.rows; row++) {
    for (let col = 0; col < FLEET.cols; col++) {
      invaders.push({ col, row });
    }
  }
  return invaders;
}

export function invaderRect(state, invader) {
  return {
    x: state.fleet.x + invader.col * FLEET.spacingX,
    y: state.fleet.y + invader.row * FLEET.spacingY,
    w: FLEET.width,
    h: FLEET.height,
  };
}

// Bunkers are one flat list of destructible blocks — which bunker a block
// belongs to never matters to any rule.
export function createBunkers() {
  const blocks = [];
  for (let b = 0; b < BUNKERS.count; b++) {
    const center = (COURT.width * (b + 1)) / (BUNKERS.count + 1);
    const origin = center - (BUNKERS.cols * BUNKERS.block) / 2;
    for (let row = 0; row < BUNKERS.rows; row++) {
      for (let col = 0; col < BUNKERS.cols; col++) {
        blocks.push({
          x: origin + col * BUNKERS.block,
          y: BUNKERS.y + row * BUNKERS.block,
        });
      }
    }
  }
  return blocks;
}

// Ticks until the next march jump, from the survivor count: a full fleet
// lumbers, the last invader sprints.
export function marchTicks(state) {
  const total = FLEET.cols * FLEET.rows;
  const survivors = Math.max(1, state.invaders.length);
  const seconds =
    FLEET.interval.end +
    (FLEET.interval.start - FLEET.interval.end) * ((survivors - 1) / (total - 1));
  return Math.max(1, Math.round(seconds / DT));
}

export function createState({
  random = Math.random,
  lives = LIVES,
  bombRate = BOMBS.rate,
} = {}) {
  const state = {
    width: COURT.width,
    height: COURT.height,
    random,
    cannon: { x: COURT.width / 2 },
    laser: null, // {x, y} — at most ONE in the air, the classic constraint
    bombs: [], // {x, y} each, falling
    fleet: { x: FLEET.left, y: FLEET.top, dir: 1, timer: 0, note: 0 },
    invaders: createFleet(),
    blocks: createBunkers(),
    invulnerable: 0,
    bombRate, // a setting → plain state, as always
    lives,
    score: 0,
    wave: 1,
    status: "playing",
  };
  state.fleet.timer = marchTicks(state);
  return state;
}
