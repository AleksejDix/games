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
  return {
    cols,
    rows,
    cell,
    x0: (court.width - cols * cell) / 2,
    y0: (court.height - rows * cell) / 2,
  };
}
