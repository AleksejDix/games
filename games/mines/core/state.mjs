// The shape of the world: parallel arrays over the field. Mines are NOT
// placed at creation — they wait for the first reveal, so the first dig
// can never die (the classic mercy, and a nice lazy-world echo).

import { FIELDS } from "./constants.mjs";

export function createState({ random = Math.random, size = 9 } = {}) {
  const n = size * size;
  return {
    random,
    size,
    mineCount: FIELDS[size] ?? Math.round(n * 0.12),
    planted: false,
    mines: Array(n).fill(false),
    counts: Array(n).fill(0),
    revealed: Array(n).fill(false),
    flags: Array(n).fill(false),
    safeLeft: 0, // set when the mines become real
    status: "playing",
  };
}
