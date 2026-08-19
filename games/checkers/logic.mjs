// ============================================================================
// logic.mjs — public API of Checkers' functional core (a barrel)
//
//   core/constants.mjs — the board and the two sides
//   core/state.mjs     — createState: 24 men on the dark squares
//   core/machine.mjs   — the status machine (playing → won)
//   core/step.mjs      — move(): forced captures, chains, crowns, the end
//   core/bot.mjs        — minimax with alpha-beta over the same generator
//
// The oldest rules on the shelf: draughts reached the 8×8 chessboard in
// twelfth-century France. The load-bearing idea is the FORCED capture —
// the rule that turns a placid board game into a tactics engine.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
export * from "./core/bot.mjs";
