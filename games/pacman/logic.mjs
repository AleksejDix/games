// ============================================================================
// logic.mjs — public API of the FUNCTIONAL CORE (a "barrel" module)
//
// The rules live in focused modules under core/:
//
//   core/constants.mjs — tuning values (speeds, scores, timers, the roster)
//   core/maze.mjs      — the board as strings, and what may stand where
//   core/state.mjs     — createState / resetPositions: the shape of the world
//   core/machine.mjs   — the status state machine (graph as data)
//   core/ghosts.mjs    — the four personalities: targets and cell decisions
//   core/step.mjs      — step / queueTurn: one tick of simulation
//
// This file just re-exports them — a FACADE: the shell (game.mjs) and the
// tests import "logic.mjs" and never learn how the core is organized
// inside, so core/ can keep being reshaped without touching a consumer.
//
// The core stays pure throughout: no canvas, no keyboard, no clock, no DOM
// in any of these files — which is exactly why `node --test` can run them.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/maze.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/ghosts.mjs";
export * from "./core/step.mjs";
