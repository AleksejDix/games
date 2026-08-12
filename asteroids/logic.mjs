// ============================================================================
// logic.mjs — public API of Asteroids' functional core (a "barrel" module)
//
//   core/constants.mjs — tuning values (SPACE, SHIP, BULLET, ASTEROIDS, ...)
//   core/state.mjs     — createState / spawnAsteroid / spawnWave / rock
//   core/machine.mjs   — the status state machine
//   core/step.mjs      — step: one tick of inertial physics; wrap
//
// Fourth game, same recipe. What's new is the physics family: rotation
// and inertia — input steers a heading, momentum does the moving — plus
// entity lists (bullets, rocks) that spawn, split, and expire, all timed
// in ticks and all colliding by one circle-vs-circle test.
// ============================================================================

export * from "./core/constants.mjs";
export * from "./core/state.mjs";
export * from "./core/machine.mjs";
export * from "./core/step.mjs";
