// ============================================================================
// render.mjs — OXO's PROJECTION: state → pixels, and nothing else.
// ============================================================================

import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";

const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const CYAN = cssVar("--cyan");
const GOLD = cssVar("--gold");

export function render(ctx, state, paused) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  const cell = width / 3;

  // The grid — four strokes, like a pencil on paper.
  ctx.strokeStyle = "rgba(230, 230, 230, 0.25)";
  ctx.lineWidth = 3;
  for (const i of [1, 2]) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 16);
    ctx.lineTo(i * cell, height - 16);
    ctx.moveTo(16, i * cell);
    ctx.lineTo(width - 16, i * cell);
    ctx.stroke();
  }

  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  state.cells.forEach((mark, i) => {
    if (!mark) return;
    const cx = (i % 3) * cell + cell / 2;
    const cy = Math.floor(i / 3) * cell + cell / 2;
    const r = cell * 0.26;
    ctx.beginPath();
    if (mark === "X") {
      ctx.strokeStyle = ACCENT;
      ctx.moveTo(cx - r, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.moveTo(cx + r, cy - r);
      ctx.lineTo(cx - r, cy + r);
    } else {
      ctx.strokeStyle = CYAN;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.stroke();
  });

  // The winning line, struck through in gold.
  if (state.line) {
    const center = (i) => [
      (i % 3) * cell + cell / 2,
      Math.floor(i / 3) * cell + cell / 2,
    ];
    const [x1, y1] = center(state.line[0]);
    const [x2, y2] = center(state.line[2]);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  if (state.status === "won") {
    drawOverlay(ctx, `${state.winner} WINS`, "Enter for a rematch");
  }
  if (state.status === "draw") {
    drawOverlay(ctx, "A DRAW", "against perfect play, it always is · Enter to try again");
  }
}
