// The shape of the world: the sequence so far, and how much of it the
// player has echoed back. `lit` is cosmetic state the SHELL writes during
// playback — the core initializes it and never reads it.

import { SIMON } from "./constants.mjs";

export function createState({ random = Math.random } = {}) {
  return {
    random,
    sequence: [Math.floor(random() * SIMON.pads)],
    progress: 0, // how many notes of the sequence are echoed so far
    score: 0, // completed rounds
    lit: null, // which pad glows right now (playback presentation)
    status: "playing",
  };
}
