// Asteroids' status graph:
//
//   playing ──▶ gameover      (last life lost)
//
// Waves are NOT states — the game never stops playing between them, so
// they're just a counter plus a "wave" event. gameover has no exit:
// restarting means a fresh createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
