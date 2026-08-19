// Whac-a-Mole's status graph: playing → gameover, and only the CLOCK
// makes the move — no mole can hurt you, only escape you.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["gameover"],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
