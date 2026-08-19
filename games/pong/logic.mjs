// ============================================================================
// logic.mjs — public API of Pong's functional core (a "barrel" module)
//
//   core/constants.mjs — tuning values (COURT, PADDLE, BALL, DT, ...)
//   core/state.mjs     — createState / serve: the shape of the world
//   core/machine.mjs   — the status state machine (graph as data)
//   core/step.mjs      — step: one tick of physics
//   core/bot.mjs        — botInput: the computer opponent as an input source
//
// Same architecture as Snake, different physics: there the core simulated a
// DISCRETE grid (one cell per tick), here it integrates CONTINUOUS motion
// (position += velocity × DT). Still no canvas, keyboard, clock, or DOM
// anywhere inside — which is why `node --test` can run all of it.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
export * from "./core/bot.mjs";
