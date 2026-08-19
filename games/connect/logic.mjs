// ============================================================================
// logic.mjs — public API of Connect Four's functional core (a barrel)
//
//   core/constants.mjs — the 7×6 rack, the two colors, the 69 lines
//   core/state.mjs     — createState: an empty rack, red to drop
//   core/machine.mjs   — the status machine (playing → won | draw)
//   core/step.mjs      — drop(): gravity, the win check, the full-rack draw
//   core/bot.mjs       — minimax with alpha-beta, center-out
//
// Milton Bradley, 1974 — tic-tac-toe with gravity. The falling disc is
// the load-bearing idea: you choose a COLUMN, physics chooses the cell,
// and every move stacks the ground the next threat stands on.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
export * from "./core/bot.mjs";
