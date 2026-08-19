// The shape of the world: a flat array of tiles, 0 marking the gap.

import { BOARD } from "./constants.mjs";

export const isSolved = (tiles) =>
  tiles.every((t, i) => t === (i + 1) % tiles.length);

// The gap's orthogonal neighbors — the only tiles allowed to move.
export function neighbors(state, index) {
  const s = state.size;
  const result = [];
  if (index % s > 0) result.push(index - 1);
  if (index % s < s - 1) result.push(index + 1);
  if (index - s >= 0) result.push(index - s);
  if (index + s < s * s) result.push(index + s);
  return result;
}

// Shuffling is a random WALK of legal moves from the solved board — never
// a random arrangement, because half of those are unsolvable (Sam Loyd
// famously offered $1000 for solving a board with just the 14 and 15
// swapped; nobody could, because nobody can). Walking legal moves keeps
// solvability by construction, with no parity math to get wrong.
export function shuffle(state) {
  let cameFrom = -1;
  const walk = state.size * state.size * BOARD.shufflePerCell;
  for (let i = 0; i < walk; i++) {
    const gap = state.tiles.indexOf(0);
    // Never immediately undo the previous move — it wastes the walk.
    const options = neighbors(state, gap).filter((n) => n !== cameFrom);
    const pick = options[Math.floor(state.random() * options.length)];
    cameFrom = gap;
    state.tiles[gap] = state.tiles[pick];
    state.tiles[pick] = 0;
  }
  // A walk can, in principle, wander home. One deterministic nudge keeps
  // the guard loop-free (the lesson from Snake's while(true) spawner).
  if (isSolved(state.tiles)) {
    const gap = state.tiles.indexOf(0);
    const n = neighbors(state, gap)[0];
    state.tiles[gap] = state.tiles[n];
    state.tiles[n] = 0;
  }
}

export function createState({ random = Math.random, size = BOARD.size } = {}) {
  const state = {
    size,
    random,
    tiles: Array.from({ length: size * size }, (_, i) => (i + 1) % (size * size)),
    moves: 0,
    status: "playing",
  };
  shuffle(state);
  return state;
}
