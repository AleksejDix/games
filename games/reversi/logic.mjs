// ============================================================================
// logic.mjs — public API of Reversi's functional core (a barrel)
//
//   core/constants.mjs — the board, the two sides, the eight directions
//   core/state.mjs     — createState: four discs crossed in the center
//   core/machine.mjs   — the status machine (playing → won | draw)
//   core/step.mjs      — place(): the flank, the flip, the pass, the count
//   core/bot.mjs       — minimax with alpha-beta over the same generator
//
// London, 1883: two Englishmen each claimed to have invented it, and the
// quarrel outlived them both. The load-bearing idea is the FLANK — every
// disc you bracket turns, so the board can swing wholesale on one move,
// and the count means nothing until the counting.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
export * from "./core/bot.mjs";
