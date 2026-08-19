// The shape of the world: 49 cells — null off the cross, true a peg,
// false an empty hole. Every game starts identically (no randomness at
// all — like OXO, this is pure thought); `selected` is shell-written
// presentation, the simon.lit precedent.

import { SIZE, onBoard } from "./constants.mjs";

export function createState({ random = Math.random } = {}) {
  const board = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      board.push(onBoard(r, c) ? true : null);
    }
  }
  board[3 * SIZE + 3] = false; // the empty heart of the cross
  return {
    random,
    board,
    pegs: 32,
    moves: 0,
    selected: null, // which peg the player has picked up (presentation)
    status: "playing",
  };
}
