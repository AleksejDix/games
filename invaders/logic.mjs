// ============================================================================
// logic.mjs — public API of Space Invaders' functional core (a barrel)
//
//   core/constants.mjs — tuning values (COURT, CANNON, FLEET, BUNKERS, ...)
//   core/state.mjs     — createState / createFleet / createBunkers / marchTicks
//   core/machine.mjs   — the status state machine
//   core/step.mjs      — step: one tick of the siege
//
// Fifth game. The new entity pattern is the FORMATION: fifty invaders
// stored as (col, row) slots around one shared origin, marching in
// discrete lockstep jumps that accelerate as the fleet thins — while
// lasers and bombs fly continuously. Two time models, one step().
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
