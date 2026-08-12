// Snake's status graph:
//
//   playing ──▶ gameover      (wall or self-collision)
//       │
//       └─────▶ cleared       (the snake fills every cell of the board)
//
// Terminal states have no exit: restarting means throwing the world away
// and calling createState() again. The graph is Snake's data; the guard
// mechanism is shared by every game.

import { createMachine } from "../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover", "cleared"],
  gameover: [],
  cleared: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
