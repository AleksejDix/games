// The shape of the world: the standard position, plus the four pieces
// of bookkeeping the RULES themselves demand — castling rights, the
// en-passant square, the fifty-move clock, and whose turn it is. That
// this bookkeeping exists at all is the deep lesson of chess state:
// the board alone does not describe the game.

import { SIZE } from "./constants.mjs";

const BACK = ["r", "n", "b", "q", "k", "b", "n", "r"];

export function createState({ random = Math.random } = {}) {
  const cells = Array(SIZE * SIZE).fill(null);
  BACK.forEach((type, col) => {
    cells[col] = { side: "black", type };
    cells[7 * SIZE + col] = { side: "white", type };
  });
  for (let col = 0; col < SIZE; col++) {
    cells[SIZE + col] = { side: "black", type: "p" };
    cells[6 * SIZE + col] = { side: "white", type: "p" };
  }
  return {
    random, // unused — chess has no chance; the harness injects it anyway
    cells,
    turn: "white",
    // FEN-style rights: uppercase white, lowercase black; K = kingside.
    castling: { K: true, Q: true, k: true, q: true },
    ep: null, // the square a double push just skipped — capturable for ONE turn
    halfmove: 0, // plies since a pawn move or capture; 100 is the fifty-move draw
    winner: null,
    status: "playing",
  };
}
