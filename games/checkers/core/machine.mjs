// Checkers' status graph — one ending, with the winner as data:
//
//   playing ──▶ won
//
// No draw state: a side that cannot move has lost, which covers every
// stalemate the simple rules can produce. A rematch is a fresh
// createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["won"],
  won: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
