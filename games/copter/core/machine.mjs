// Cave Copter's status graph — the airborne serving state again:
//
//   ready ──▶ playing ──▶ gameover
//
// The hover waits for the rotor; the walls end it.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  ready: ["playing"],
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
