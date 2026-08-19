// Flappy's status graph — Breakout's serving idea, airborne:
//
//   ready ──▶ playing ──▶ gameover
//
// The hover waits for the first flap; the ground and the pipes end it.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  ready: ["playing"],
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
