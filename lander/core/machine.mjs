// Lunar Lander's status graph — the first with two endings:
//
//   playing ──▶ landed       (slow, upright, on a level segment)
//      │
//      └──────▶ crashed      (anything else the ground objects to)
//
// Both are terminal: a new descent means a new moon — createState().

import { createMachine } from "../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["landed", "crashed"],
  landed: [],
  crashed: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
