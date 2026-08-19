// ============================================================================
// logic.mjs — public API of OXO's functional core (a barrel)
//
//   core/constants.mjs — the eight winning lines
//   core/state.mjs     — createState (with position seeding)
//   core/machine.mjs   — the status machine (won | draw, both final)
//   core/step.mjs      — place; step: an honest no-op
//   core/ai.mjs        — aiMove: minimax, provably never loses
//
// 1952: noughts and crosses on the Cambridge EDSAC — arguably the first
// graphical computer game ever made. Ours adds what EDSAC also had: a
// machine opponent that plays perfectly.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
export * from "./core/ai.mjs";
