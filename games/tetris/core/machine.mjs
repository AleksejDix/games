// Tetris' status graph:
//
//   playing ──▶ gameover      (a spawn with nowhere to stand)
//
// There is no winning — the well always fills eventually; the game is
// about how long and how well. A new game is a fresh createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  ready: ["playing"], // the world holds until the player starts it
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
