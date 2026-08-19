// The runner's status graph — the same shape as Flappy's, laid flat:
//
//   ready ──▶ playing ──▶ gameover
//
// ready is authentic here beyond the house rule: the original Chrome
// dino stands frozen in the error page until the first jump.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  ready: ["playing"],
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
