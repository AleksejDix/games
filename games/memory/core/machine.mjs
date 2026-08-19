// Memory's status graph — like Fifteen's, only a happy ending:
//
//   playing ──▶ solved
//
// A new deal is a fresh createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["solved"],
  solved: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
