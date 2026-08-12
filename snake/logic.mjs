// ============================================================================
// logic.mjs — public API of the FUNCTIONAL CORE (a "barrel" module)
//
// The rules themselves now live in focused modules under core/:
//
//   core/constants.mjs — tuning values (DIRS, BONUS)
//   core/state.mjs     — createState: the shape of the world
//   core/spawn.mjs     — spawnFood / spawnBonus placement rules
//   core/machine.mjs   — the status state machine (graph as data)
//   core/step.mjs      — step / queueDirection: one tick of simulation
//
// This file just re-exports them. Why keep it at all? It's a FACADE: the
// shell (game.mjs) and the tests import "logic.mjs" and never learn how the
// core is organized inside. We can keep splitting, merging, and renaming
// core/ files forever without touching a single consumer — the untouched,
// still-green test suite after this very refactor is the proof.
//
// The core remains pure throughout: no canvas, no keyboard, no clock, no
// DOM in any of these files — which is exactly why `node --test` can run
// them (see "functional core, imperative shell").
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/spawn.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
