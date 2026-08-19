// Fifteen's status graph — the smallest possible, and the first where the
// only ending is a HAPPY one:
//
//   playing ──▶ solved
//
// solved has no exit: a new puzzle is a new createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["solved"],
  solved: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
