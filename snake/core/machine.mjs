// Snake's status graph — the smallest possible machine:
//
//   playing ──▶ gameover      (wall or self-collision)
//
// gameover has no exit: restarting means throwing the world away and
// calling createState() again. The graph is Snake's data; the guard
// mechanism is shared by every game.

import { createMachine } from "../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
