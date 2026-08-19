// Connect Four's status graph — two endings, both final:
//
//   playing ──▶ won | draw
//
// A rematch is a fresh createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["won", "draw"],
  won: [],
  draw: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
