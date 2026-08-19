// ============================================================================
// logic.mjs — Lights Out's functional core (a barrel). 1995: tap a cell,
// toggle its cross, reach darkness. Secretly linear algebra over GF(2) —
// press order never matters, and every press is its own undo.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
