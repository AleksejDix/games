// Space Invaders' status graph:
//
//   playing ──▶ gameover      (last life shot away, or the fleet LANDS)
//
// There is no winning — waves are endless, like Asteroids. gameover has
// no exit: restarting means a fresh createState().

import { createMachine } from "../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
