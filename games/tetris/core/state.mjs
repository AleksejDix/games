// The shape of the world: a flat well (0 = empty, 1–7 = which tetromino
// left the cell behind), the falling piece, the preview, and the bag.

import { WELL, PIECES, TYPES, GRAVITY } from "./constants.mjs";
import { shuffle } from "../../../shared/random.mjs";

export const gravityMs = (level) =>
  Math.max(GRAVITY.min, GRAVITY.start - (level - 1) * GRAVITY.perLevel);

// The falling piece's absolute cells.
export const pieceCells = (piece) =>
  PIECES[piece.type][piece.rot].map(([x, y]) => [piece.x + x, piece.y + y]);

// Can this piece exist here? Inside the walls, above the floor, and not
// through the rubble. Cells above the well's top (y < 0) are legal — a
// fresh piece may briefly overhang the sky.
export function fits(state, piece) {
  return pieceCells(piece).every(
    ([x, y]) =>
      x >= 0 &&
      x < WELL.cols &&
      y < WELL.rows &&
      (y < 0 || state.well[y * WELL.cols + x] === 0)
  );
}

// The seven-bag randomizer: shuffle a bag of all seven, deal until empty,
// refill. Droughts are bounded — you are never more than 12 draws from an
// I — which is the modern standard, and deterministic under the injected
// random (Fisher–Yates, no rejection).
export function drawPiece(state) {
  if (state.bag.length === 0) {
    state.bag = shuffle([...TYPES], state.random);
  }
  return state.bag.pop();
}

export const spawn = (type) => ({ type, rot: 0, x: 3, y: 0 });

export function createState({ random = Math.random, startLevel = 1, started = false } = {}) {
  const state = {
    random,
    well: Array(WELL.cols * WELL.rows).fill(0),
    bag: [],
    piece: null,
    next: null,
    score: 0,
    lines: 0,
    level: startLevel,
    stepMs: gravityMs(startLevel), // the engine reads this, like Snake's
    status: started ? "playing" : "ready",
  };
  state.piece = spawn(drawPiece(state));
  state.next = drawPiece(state);
  return state;
}
