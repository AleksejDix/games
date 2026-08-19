// Sokoban's status graph — Fifteen's twin, the puzzle shape where the
// only ending is a HAPPY one:
//
//   playing ──▶ solved
//
// solved has no exit: the next warehouse is a new createState(). There
// is no "stuck" status — a box jammed in a corner is undone out of, not
// died from.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["solved"],
  solved: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
