// Tuning values. The warehouse is logical — rows × cols of cells — and
// the renderer decides pixels; there is no DT because there is no time:
// the world changes only when the keeper takes a step.

// The four directions as row/column vectors — the only geometry the
// rules need. A push is the same vector applied twice: once to the
// keeper, once to the box ahead of him.
export const DIRS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};
