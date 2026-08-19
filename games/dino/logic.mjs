// ============================================================================
// logic.mjs — public API of the Dino Runner's functional core (a barrel)
//
//   core/constants.mjs — tuning values (SKY, DINO, RUN, CACTI, BIRD)
//   core/state.mjs     — createState / extendObstacles
//   core/machine.mjs   — the status machine (ready → playing → gameover)
//   core/step.mjs      — step: one tick of the desert
//
// The Chrome offline page's T-rex (2014), rebuilt on the house
// mechanisms: a streaming world (Racer's road, flattened), an impulse
// jump (Flappy's, with a floor), and a second stance — the duck — as
// the entire counter to the mid-height bird.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
