// The shape of the world: a T-rex at its fixed column, and a lazy list
// of obstacles at WORLD distances (screen x = obstacle.x - distance).
// Spawning follows the original's horizon: each obstacle carries the GAP
// to its successor, rolled from the speed at its own birth.

import { SKY, RUN, TYPES, SPAWN } from "./constants.mjs";

const TYPE_NAMES = Object.keys(TYPES); // cactusSmall, cactusLarge, pterodactyl

// The original's gap: minGap = width·speed + typeMinGap·gapCoefficient,
// stretched up to 1.5× by the roll. Speed is in frame units, as shipped.
function rollGap(state, type, width) {
  const minGap = Math.round(width * state.speed + type.minGap * SPAWN.gapCoefficient);
  const maxGap = Math.round(minGap * SPAWN.maxGapCoefficient);
  return minGap + Math.floor(state.random() * (maxGap - minGap));
}

// Pick a type the rules allow right now: fast enough for it, and never
// three of the same in a row. The fallback walks the list instead of
// re-rolling, so an injected cycling random can never loop forever.
function pickType(state) {
  let i = Math.floor(state.random() * TYPE_NAMES.length);
  for (let tries = 0; tries < TYPE_NAMES.length; tries++, i = (i + 1) % TYPE_NAMES.length) {
    const name = TYPE_NAMES[i];
    if (state.speed < TYPES[name].minSpeed) continue;
    if (name === state.lastType && state.duplicates >= SPAWN.maxDuplication - 1) continue;
    return name;
  }
  return "cactusSmall"; // always legal
}

function makeObstacle(state, at) {
  const name = pickType(state);
  const type = TYPES[name];

  // Cacti bunch up once the desert is fast enough for the cut.
  const size =
    state.speed > type.multipleSpeed
      ? 1 + Math.floor(state.random() * SPAWN.maxLength)
      : 1;
  const w = type.w * size;

  // Birds pick an altitude; everything else stands on its ground line.
  const y = Array.isArray(type.y)
    ? type.y[Math.floor(state.random() * type.y.length)]
    : type.y;

  state.duplicates = name === state.lastType ? state.duplicates + 1 : 0;
  state.lastType = name;

  return {
    x: at,
    y,
    w,
    h: type.h,
    type: name,
    size,
    gap: rollGap(state, type, w),
    // Birds drift against the ground: a little faster or slower.
    speedOffset:
      type.speedOffset === undefined
        ? 0
        : state.random() > 0.5 ? type.speedOffset : -type.speedOffset,
  };
}

// Keep the horizon stocked, the original's way: when the last obstacle
// plus its own gap has come inside the screen, the next enters at the
// right edge.
export function extendObstacles(state) {
  const horizon = state.distance + SKY.width;
  while (true) {
    const last = state.obstacles.at(-1);
    if (last && last.x + last.w + last.gap >= horizon) return;
    state.obstacles.push(makeObstacle(state, last ? last.x + last.w + last.gap : horizon));
  }
}

export function createState({ random = Math.random, started = false } = {}) {
  const state = {
    random,
    dino: { elev: 0, vy: 0, ducking: false }, // elevation above the feet line; vy in px/frame, up positive
    distance: 0,
    speed: RUN.speed, // frame units, 6 → 13, like the original
    obstacles: [],
    lastType: null,
    duplicates: 0,
    score: 0,
    status: started ? "playing" : "ready",
  };
  extendObstacles(state);
  return state;
}
