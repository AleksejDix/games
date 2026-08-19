// ============================================================================
// logic.mjs — public API of Sokoban's functional core (a barrel)
//
//   core/constants.mjs — the four directions (DIRS)
//   core/levels.mjs    — eight original warehouses, standard notation
//   core/state.mjs     — parseLevel / createState / isSolved
//   core/machine.mjs   — the status machine (playing → solved, and stop)
//   core/step.mjs      — move / undo; step: an honest no-op
//
// From 1982: Hiroyuki Imabayashi's warehouse keeper — "sōko-ban" — the
// puzzle that made a genre out of one restriction: you may push a single
// box, and you may never pull. Turn-based like Fifteen: actions in,
// events out, time itself a no-op. Undo is unlimited, because the
// interesting part was always the thinking.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/levels.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
