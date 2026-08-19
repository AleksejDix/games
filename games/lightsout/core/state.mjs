// The shape of the world: 25 booleans. Scrambling presses random cells
// starting from the SOLVED (all-dark) board — since every press is its
// own inverse (GF(2)), the scramble is literally a walkthrough of one
// solution, so solvability holds by construction.

import { BOARD } from "./constants.mjs";
import { flipCross } from "./step.mjs";

export function createState({ random = Math.random, scrambles = BOARD.scrambles } = {}) {
  const state = {
    random,
    size: BOARD.size,
    grid: Array(BOARD.size * BOARD.size).fill(false),
    scrambles, // a setting → plain state (and the record's variant key)
    moves: 0,
    status: "playing",
  };
  for (let i = 0; i < scrambles; i++) {
    flipCross(state, Math.floor(random() * state.grid.length));
  }
  // A scramble can cancel itself out — one deterministic nudge, no loop
  // (Snake's while(true) lesson, as always).
  if (state.grid.every((c) => !c)) flipCross(state, 12);
  return state;
}
