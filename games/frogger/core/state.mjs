// The shape of the world: a frog on a grid, lanes in continuous flow.
// Items are spaced evenly with a random phase per lane — the pattern is
// fixed (learnable, like the arcade), the phase makes each game fresh.

import { COURT, ROWS, LANES, LIVES } from "./constants.mjs";

export function createState({ random = Math.random } = {}) {
  const lanes = Array(ROWS).fill(null);
  for (const [row, spec] of Object.entries(LANES)) {
    const span = COURT.width + spec.w;
    const phase = random() * span;
    lanes[row] = {
      ...spec,
      items: Array.from({ length: spec.count }, (_, i) => ({
        x: ((phase + (i * span) / spec.count) % span) - spec.w / 2,
      })),
    };
  }
  return {
    random,
    frog: { x: COURT.width / 2, row: ROWS - 1 },
    lanes,
    homes: [false, false, false, false, false],
    lives: LIVES,
    pace: 1, // everything multiplies by this; clears raise it
    score: 0,
    status: "playing",
    tick: 0, // world time: +1 per simulated step (replays anchor to it)
  };
}
