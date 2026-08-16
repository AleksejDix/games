// ============================================================================
// logic.mjs — public API of Racer's functional core (a barrel)
//
//   core/constants.mjs — tuning values (COURT, CAR, SPEED, ROAD, ...)
//   core/state.mjs     — createState / centerAt / extendRoad
//   core/machine.mjs   — the status machine
//   core/step.mjs      — step: one tick of the run
//
// Seventh game: a SCROLLING WORLD (the car holds its screen row while
// `distance` advances), a road that generates itself segment by segment
// with smoothstep curves, traffic passed by relative speed, and a single
// resource — TIME — that only checkpoints refill.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
