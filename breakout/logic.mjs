// ============================================================================
// logic.mjs — public API of Breakout's functional core (a "barrel" module)
//
//   core/constants.mjs — tuning values (COURT, PADDLE, BALL, BRICKS, ...)
//   core/state.mjs     — createState / createBricks / placeBall
//   core/machine.mjs   — the explicit status state machine
//   core/step.mjs      — step: one tick of physics; launch: the serve
//
// Third game, same recipe: pure core behind a facade, imperative shell on
// top. What's new here is rectangle-vs-rectangle (AABB) collision with
// reflection on the axis of least penetration — see core/step.mjs.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
