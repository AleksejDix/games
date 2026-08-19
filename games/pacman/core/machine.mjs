// Pac-Maze's status graph:
//
//   ready ──▶ playing ⇄ caught      (a life lost freezes the world for a
//                │                   beat, then positions reset — the
//                │                   original's death pause)
//                └─────▶ gameover   (the LAST life lost skips the pause:
//                                    there is nothing left to reset)
//
// Note what is NOT a status: frightened mode, the scatter/chase alternation,
// a cleared level. Those are timers and counters INSIDE playing — the world
// keeps simulating through all of them. Statuses are for when the rules of
// time itself change. Terminal states have no exit: restarting means
// throwing the world away and calling createState() again.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  ready: ["playing"], // the world holds until the first steer
  playing: ["caught", "gameover"],
  caught: ["playing"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
