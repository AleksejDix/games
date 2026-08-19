// ============================================================================
// logic.mjs — public API of Fifteen's functional core (a barrel)
//
//   core/constants.mjs — tuning values (BOARD)
//   core/state.mjs     — createState / shuffle / neighbors / isSolved
//   core/machine.mjs   — the status machine (the first all-happy ending)
//   core/step.mjs      — slide / slideDirection; step: an honest no-op
//
// Tenth game, from 1880 — the oldest in the catalog and its first
// TURN-BASED one: no clock, no loop, a bare session. Actions in, events
// out; time itself is a no-op. Shuffles are random walks of legal moves,
// solvable by construction — Sam Loyd's swindle stays in the museum.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
