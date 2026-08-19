// The shape of the world: 64 cells, pieces only on the dark squares.
// A piece is { side, king } — everything else the game knows (whose
// turn, a chain in progress, who won) sits beside the board.

import { SIZE, playable } from "./constants.mjs";

export function createState({ random = Math.random } = {}) {
  const cells = Array(SIZE * SIZE).fill(null);
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!playable(row, col)) continue;
      if (row < 3) cells[row * SIZE + col] = { side: "white", king: false };
      if (row > 4) cells[row * SIZE + col] = { side: "red", king: false };
    }
  }
  return {
    random, // unused — checkers has no chance; the harness injects it anyway
    cells,
    turn: "red",
    chained: null, // mid multi-jump: ONLY this piece may move, and only by jumping
    selected: null, // cosmetic: the piece in hand (the render glows it, rules ignore it)
    winner: null,
    status: "playing",
  };
}
