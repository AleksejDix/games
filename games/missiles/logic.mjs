// ============================================================================
// logic.mjs — public API of Missile Command's functional core (a barrel)
//
//   core/constants.mjs — tuning values (SKY, CITIES, SILOS, BLAST, ...)
//   core/state.mjs     — createState
//   core/machine.mjs   — the status machine (playing ⇄ debrief → gameover)
//   core/step.mjs      — step; launch: the pointer action; blastRadius
//
// Eighth game, and the first driven by a POINTER — which the core never
// knows: launch(state, x, y) is just an action at a point, and the
// crosshair is plain input data. The mechanic is indirection: fireballs
// do the killing, and the skill is leading the target.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
