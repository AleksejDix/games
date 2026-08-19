// ============================================================================
// render.mjs — OXO's PROJECTION: state → pixels, and nothing else.
// ============================================================================

import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { boardGeometry } from "../../shared/board.mjs";

const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const CYAN = cssVar("--cyan");
const GOLD = cssVar("--gold");
const GRID_INK = cssVarAlpha("--text", 0.25);

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);
  const geom = boardGeometry(ctx.canvas, 3);
  const { cell, x0, y0 } = geom;

  // The grid — four strokes, like a pencil on paper.
  ctx.strokeStyle = GRID_INK;
  ctx.lineWidth = 3;
  for (const i of [1, 2]) {
    ctx.beginPath();
    ctx.moveTo(x0 + i * cell, y0 + 16);
    ctx.lineTo(x0 + i * cell, y0 + 3 * cell - 16);
    ctx.moveTo(x0 + 16, y0 + i * cell);
    ctx.lineTo(x0 + 3 * cell - 16, y0 + i * cell);
    ctx.stroke();
  }

  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  state.cells.forEach((mark, i) => {
    if (!mark) return;
    const { x, y } = geom.center(i);
    const r = cell * 0.26;
    ctx.beginPath();
    if (mark === "X") {
      ctx.strokeStyle = ACCENT;
      ctx.moveTo(x - r, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.moveTo(x + r, y - r);
      ctx.lineTo(x - r, y + r);
    } else {
      ctx.strokeStyle = CYAN;
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.stroke();
  });

  // The winning line, struck through in gold.
  if (state.line) {
    const a = geom.center(state.line[0]);
    const b = geom.center(state.line[2]);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  if (state.status === "won") {
    drawOverlay(ctx, `${state.winner} WINS`, "Enter for a rematch");
  }
  if (state.status === "draw") {
    drawOverlay(ctx, "A DRAW", "against perfect play, it always is · Enter to try again");
  }
}
