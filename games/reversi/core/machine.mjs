// Reversi's status graph — two endings, both counted off the board:
//
//   playing ──▶ won
//        └────▶ draw
//
// The game ends when NEITHER side can place — usually a full board,
// occasionally a starved one. Equal discs is a draw, an honest result
// on a board with an even number of squares. A rematch is a fresh
// createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["won", "draw"],
  won: [],
  draw: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
