// ============================================================================
// logic.mjs — Minesweeper's functional core (a barrel). 1989: hidden
// state turned adversarial — honest numbers, dishonest silence. Mines
// plant on the first dig (never under it), zeros flood, flags are
// beliefs, reveals are facts.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
