// 2048's status graph: playing → gameover, when the board is full AND
// silent. Reaching 2048 is a milestone, not an ending — the board plays
// on, as the original did.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
