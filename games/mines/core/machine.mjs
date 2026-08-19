// Minesweeper's status graph:
//
//   playing ──▶ solved | gameover
//
// A new field is a fresh createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["solved", "gameover"],
  solved: [],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
