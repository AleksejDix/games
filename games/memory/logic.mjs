// ============================================================================
// logic.mjs — public API of Memory's functional core (a barrel)
//
//   core/constants.mjs — deck sizes and board layouts
//   core/state.mjs     — createState: pairs, Fisher–Yates shuffled
//   core/machine.mjs   — the status machine (only a happy ending)
//   core/step.mjs      — flip / settle; step: an honest no-op
//
// Pelmanism, the Victorian parlor game. The board hides its state and
// the real game plays in the player's head — the core only enforces the
// settling rule and counts the attempts.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
