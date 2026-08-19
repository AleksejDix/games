// ============================================================================
// board.mjs — square-board geometry, computed ONCE per board.
//
// Five games each computed their cells twice: once in the renderer to
// draw, once in the shell to pick — and the hi-dpi migration proved what
// happens to twin computations: they drift, and clicks land beside their
// cells. One function now serves both callers (its result is exactly the
// shape pickCell takes), so the drawn board and the picked board cannot
// disagree. Memory's per-deck layout delegates here too.
// ============================================================================

import { courtSize } from "./resolution.mjs";

export function boardGeometry(canvas, cols, rows = cols) {
  const court = courtSize(canvas);
  const cell = Math.min(court.width / cols, court.height / rows);
  const x0 = (court.width - cols * cell) / 2;
  const y0 = (court.height - rows * cell) / 2;
  return {
    cols,
    rows,
    cell,
    x0,
    y0,
    // The two answers every caller derived by hand (the audit counted
    // five spellings of this arithmetic across fourteen renderers, twice
    // divergence-prone within one file): a cell's center and its corner,
    // straight from the index.
    center: (i) => ({
      x: x0 + (i % cols) * cell + cell / 2,
      y: y0 + Math.floor(i / cols) * cell + cell / 2,
    }),
    corner: (i) => ({
      x: x0 + (i % cols) * cell,
      y: y0 + Math.floor(i / cols) * cell,
    }),
  };
}
