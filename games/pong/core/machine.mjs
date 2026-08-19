// Pong's status graph:
//
//   ready ──▶ playing ──▶ gameover      (first to winScore)
//
// ready is the attract screen made a rule: the court holds still while
// the players pick a mode (1P/2P — the 1972 cabinet's start buttons),
// and start() serves. gameover has no exit: restarting means a fresh
// createState(), which lands back on ready — the arcade loop.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  ready: ["playing"],
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
