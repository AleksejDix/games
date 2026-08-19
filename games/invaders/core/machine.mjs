// Space Invaders' status graph:
//
//   playing ⇄ respawning      (the original's death pause: the world
//      │                       freezes for a beat after a hit)
//      └────▶ gameover        (last life shot away, or the fleet LANDS)
//
// There is no winning — waves are endless, like Asteroids. gameover has
// no exit: restarting means a fresh createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["respawning", "gameover"],
  respawning: ["playing"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
