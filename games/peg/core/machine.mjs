// Peg Solitaire's status graph — two endings, decided moves earlier
// than you notice:
//
//   playing ──▶ solved | stuck
//
// A new board is a fresh createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["solved", "stuck"],
  solved: [],
  stuck: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
