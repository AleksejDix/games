// ============================================================================
// logic.mjs — public API of Chess' functional core (a barrel)
//
//   core/constants.mjs — the board, the sides, the material scale
//   core/state.mjs     — createState: the 1475 position and its bookkeeping
//   core/moves.mjs     — LEGAL generation: pins and traps via one filter
//   core/machine.mjs   — the status machine (won by mate, drawn twice over)
//   core/step.mjs      — move(): consequences, clocks, endings — and perft
//   core/bot.mjs       — alpha-beta over the same generator
//
// The crown of the strategy shelf. The move generator answers to perft:
// published node counts, matched exactly, in the tests.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/moves.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
export * from "./core/bot.mjs";
