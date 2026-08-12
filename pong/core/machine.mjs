// Pong's status graph:
//
//   playing ──▶ gameover      (first to winScore)
//
// gameover has no exit: restarting means a fresh createState(). If Pong
// ever grows a between-points pause, it becomes a "serving" state here —
// see Breakout's machine for what that looks like.

import { createMachine } from "../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
