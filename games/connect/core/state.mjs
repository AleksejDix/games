// The shape of the world: 42 cells, row 0 at the top, empty at the
// start. A cell holds a side ("red" / "gold") or null — everything else
// the game knows (whose turn, the winning line, who won) sits beside
// the rack.

import { COLS, ROWS } from "./constants.mjs";

export function createState({ random = Math.random } = {}) {
  return {
    random, // unused — Connect Four has no chance; the harness injects it anyway
    cells: Array(COLS * ROWS).fill(null),
    turn: "red",
    winner: null,
    line: null, // the four indices that won, for the renderer's ring
    status: "playing",
  };
}
