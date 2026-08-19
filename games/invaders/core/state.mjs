// The shape of the world: cannon, fleet, bunkers.

import { COURT, FLEET, BUNKERS, BOMBS, UFO, LIVES, DT } from "./constants.mjs";

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
// belongs to never matters to any rule. The silhouette comes from the
// shape strings in constants: '#' becomes a block, spaces are the sloped
// shoulders and the archway.
export function createBunkers() {
  const blocks = [];
  const cols = BUNKERS.shape[0].length;
  for (let b = 0; b < BUNKERS.count; b++) {
    const center = (COURT.width * (b + 1)) / (BUNKERS.count + 1);
    const origin = center - (cols * BUNKERS.block) / 2;
    BUNKERS.shape.forEach((rowStr, row) => {
      [...rowStr].forEach((ch, col) => {
        if (ch !== "#") return;
        blocks.push({
          x: origin + col * BUNKERS.block,
          y: BUNKERS.y + row * BUNKERS.block,
        });
      });
    });
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
  started = false, // true skips ready — thumbnails and tests
} = {}) {
  const state = {
    width: COURT.width,
    height: COURT.height,
    random,
    cannon: { x: COURT.width / 2 },
    laser: null, // {x, y} — at most ONE in the air, the classic constraint
    bombs: [], // {x, y, kind} each, falling
    fleet: { x: FLEET.left, y: FLEET.top, dir: 1, timer: 0, note: 0 },
    invaders: createFleet(),
    blocks: createBunkers(),
    ufo: null, // {x, dir} while the saucer crosses
    ufoTimer: 0, // ticks until its next visit
    shots: 0, // lifetime lasers fired — the UFO jackpot counts these
    invulnerable: 0,
    respawnTimer: 0, // ticks left in the death freeze
    extraLifeAwarded: false,
    bombRate, // a setting → plain state, as always
    lives,
    score: 0,
    wave: 1,
    status: started ? "playing" : "ready",
    tick: 0, // world time: +1 per simulated step (replays anchor to it)
  };
  state.fleet.timer = marchTicks(state);
  state.ufoTimer = Math.round(UFO.interval / DT);
  return state;
}
