// Tuning values and shared vocabulary for the whole core.
// Numbers a game designer might tweak live here, not buried in logic.

// One simulation tick — the shell multiplies by 1000 for the clock.
// Movement is CELL-TO-CELL (like Snake), but on a 60Hz tick so the four
// actors can run at four different speeds: each one carries a countdown
// and hops a whole cell when it reaches zero. Fewer ticks per cell =
// faster. This is the 1980 speed table, quantized to the grid.
export const DT = 1 / 60;

// The four movement directions, named — names are what the wish queue,
// the reversal table, and the renderer's rotation all speak.
export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Reversal lookup: the one turn a ghost may never choose on its own.
export const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

// Ticks per cell for each kind of mover. Frightened ghosts crawl (the
// famous turnabout: suddenly YOU are faster); bare eyes sprint home.
export const SPEED = {
  pac: 10,
  ghost: 11,
  frightened: 16,
  eyes: 5,
};

// Later levels hurry: one tick shaved per level, with a floor that keeps
// the game physically playable. Frightened and eyes speeds stay fixed.
export const pacInterval = (level) => Math.max(6, SPEED.pac - (level - 1));
export const ghostInterval = (level) => Math.max(7, SPEED.ghost - (level - 1));

// The 1980 scoring table. Ghosts eaten in ONE frightened window double:
// 200, 400, 800, 1600 — the value is ghost × 2^(ghosts already eaten).
export const SCORE = {
  pellet: 10,
  power: 50,
  ghost: 200,
};

// Frightened mode, in ticks (7s at 60Hz), shrinking per level toward a
// floor — exactly the design's difficulty ramp, coarsened to one dial.
export const FRIGHT = { ticks: 420, shrink: 60, floor: 120 };
export const frightTicks = (level) =>
  Math.max(FRIGHT.floor, FRIGHT.ticks - (level - 1) * FRIGHT.shrink);

// The global mode clock: all ghosts scatter (7s) then chase (20s),
// repeating, with scatter shrinking on later levels. The original used a
// finite table ending in permanent chase; the endless alternation keeps
// the same rhythm with one mechanism.
export const MODES = { scatter: 420, chase: 1200, shrink: 60, floor: 120 };
export const scatterTicks = (level) =>
  Math.max(MODES.floor, MODES.scatter - (level - 1) * MODES.shrink);

// The four personalities, in house-exit order. The original released
// ghosts by pellet-count thresholds; fixed tick delays keep the stagger
// with one number each. Scatter corners are named here as compass
// corners; ghosts.mjs turns them into tiles of the actual maze.
export const GHOSTS = [
  { name: "blinky", delay: 0, corner: "topRight" },
  { name: "pinky", delay: 120, corner: "topLeft" },
  { name: "inky", delay: 360, corner: "bottomRight" },
  { name: "clyde", delay: 600, corner: "bottomLeft" },
];

// Clyde's split personality: chase pac when farther than 8 cells, slink
// to his corner when closer. Compared squared, so no square roots.
export const CLYDE_RANGE = 8;

// The death freeze: after a catch the world stands still for a beat —
// Invaders' dramatic pause, as a machine state — then positions reset.
export const CAUGHT = { freeze: 90 };

export const LIVES = 3;
