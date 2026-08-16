// Racer's status graph:
//
//   playing ──▶ gameover      (the clock hits zero — nothing else kills)
//
// Crashes aren't states: they cost speed and raise a shield, but the run
// goes on. Only time ends it. gameover has no exit: a new run is a new
// createState().

import { createMachine } from "../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
