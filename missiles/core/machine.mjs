// Missile Command's status graph:
//
//   playing ⇄ debrief        (the between-wave tally: bonus counted,
//      │                      silos rebuilt and rearmed, rain thickens)
//      └────▶ gameover       (a wave ends with no cities left)
//
// Cities never come back — the game is about how long, not whether.
// gameover has no exit: a new defense is a new createState().

import { createMachine } from "../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["debrief", "gameover"],
  debrief: ["playing"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
