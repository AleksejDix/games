// ============================================================================
// render.mjs — Reversi's PROJECTION: state → pixels, and nothing else.
//
// The hints query the core's own legalPlacements (Peg's pattern): a
// glowing square IS a legal square, and the flank rule shows itself —
// a square that flips nothing simply doesn't light up. The felt look
// is all palette: panel squares under a thin grid of the page's own
// background, white discs in ink, black discs as a faint fill ringed
// in the same ink.
// ============================================================================

import * as Reversi from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { boardGeometry } from "../../shared/board.mjs";

const BG = cssVar("--bg");
const PANEL = cssVar("--panel");
const IVORY = cssVar("--text");
const DUSK = cssVarAlpha("--text", 0.15);
const ACCENT = cssVar("--accent");
const HINT = cssVarAlpha("--accent", 0.5);

export function render(ctx, state, paused) {
  const { cell, x0, y0 } = boardGeometry(ctx.canvas, Reversi.SIZE);
  const span = Reversi.SIZE * cell;

  // The felt, then the grid scored into it.
  ctx.fillStyle = PANEL;
  ctx.fillRect(x0, y0, span, span);
  ctx.strokeStyle = BG;
  ctx.lineWidth = Math.max(1, cell * 0.03);
  for (let i = 0; i <= Reversi.SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(x0 + i * cell, y0);
    ctx.lineTo(x0 + i * cell, y0 + span);
    ctx.moveTo(x0, y0 + i * cell);
    ctx.lineTo(x0 + span, y0 + i * cell);
    ctx.stroke();
  }

  state.cells.forEach((disc, i) => {
    if (!disc) return;
    const cx = x0 + (i % Reversi.SIZE) * cell + cell / 2;
    const cy = y0 + Math.floor(i / Reversi.SIZE) * cell + cell / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.36, 0, Math.PI * 2);
    if (disc === "white") {
      ctx.fillStyle = IVORY;
      ctx.fill();
    } else {
      ctx.fillStyle = DUSK;
      ctx.fill();
      ctx.strokeStyle = IVORY;
      ctx.lineWidth = Math.max(2, cell * 0.05);
      ctx.stroke();
    }

    if (i === state.last) {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = Math.max(2, cell * 0.06);
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  ctx.fillStyle = HINT;
  for (const i of Reversi.legalPlacements(state)) {
    const cx = x0 + (i % Reversi.SIZE) * cell + cell / 2;
    const cy = y0 + Math.floor(i / Reversi.SIZE) * cell + cell / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.status === "won") {
    drawOverlay(ctx, `${state.winner.toUpperCase()} WINS`, "Enter for a rematch");
  } else if (state.status === "draw") {
    drawOverlay(ctx, "A DRAW", "Enter for a rematch");
  }
}
