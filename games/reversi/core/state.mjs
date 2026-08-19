// The shape of the world: 64 cells, each empty or owned by a side. A
// disc is just its color — reversi has no kings, no chains, no memory
// beyond the board. The four starting discs sit crossed in the center:
// white on d4/e5, black on d5/e4, and black opens.

import { SIZE } from "./constants.mjs";

export function createState({ random = Math.random } = {}) {
  const cells = Array(SIZE * SIZE).fill(null);
  const mid = SIZE / 2;
  cells[(mid - 1) * SIZE + (mid - 1)] = "white"; // d4
  cells[mid * SIZE + mid] = "white"; // e5
  cells[(mid - 1) * SIZE + mid] = "black"; // e4
  cells[mid * SIZE + (mid - 1)] = "black"; // d5
  return {
    random, // unused — reversi has no chance; the harness injects it anyway
    cells,
    turn: "black",
    last: null, // the most recent placement, ringed by the renderer
    winner: null,
    status: "playing",
  };
}
