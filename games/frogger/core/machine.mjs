// Frogger's status graph: playing → gameover when the frogs run out.
// Clears are events, not states — the river never pauses.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
