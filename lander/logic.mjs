// ============================================================================
// logic.mjs — public API of Lunar Lander's functional core (a barrel)
//
//   core/constants.mjs — tuning values (SKY, SHIP, TERRAIN)
//   core/state.mjs     — createState / createTerrain / groundAt
//   core/machine.mjs   — the status machine (two endings!)
//   core/step.mjs      — step: one tick of the descent
//
// Sixth game, and the engine's validation piece: Asteroids' inertia plus
// gravity and a fuel budget, with the catalog's first inverted goal —
// the game is won by STOPPING, gently, upright, on level ground.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
