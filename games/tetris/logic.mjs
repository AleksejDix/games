// ============================================================================
// logic.mjs — public API of Tetris' functional core (a barrel)
//
//   core/constants.mjs — the well, gravity, scoring, and the seven pieces
//                        as string art parsed to offsets
//   core/state.mjs     — createState / drawPiece (seven-bag) / fits /
//                        pieceCells / gravityMs
//   core/machine.mjs   — the status machine (no winning, only enduring)
//   core/step.mjs      — gravity, move, rotate (with kicks), drops, ghost
//
// The finale. Eleven games taught the parts: Snake's variable clock is
// the gravity, Fifteen's actions are the steering, the machine guards the
// top-out, the bag deals fair — and the well remembers everything.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
