// Lights Out's status graph — only a happy ending:
//
//   playing ──▶ solved
//
// A new puzzle is a fresh createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["solved"],
  solved: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
