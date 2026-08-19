// ============================================================================
// render.mjs — Whac-a-Mole's PROJECTION. Nine mounds, occasional
// purple optimists, and the clock draining across the top.
// holeGeometry is exported for the mallet's hit-testing.
// ============================================================================

import * as Whac from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";

const BG = cssVar("--bg");
const TEXT = cssVar("--text");
const GOLD = cssVar("--gold");
const RED = cssVar("--red");
const PURPLE = cssVar("--purple");
const PANEL = cssVar("--panel");
const CLOCK_TRACK = cssVarAlpha("--text", 0.15);

export function holeGeometry(canvas) {
  return { x0: 15, y0: 90, cell: 150 };
}

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);

  // The clock, draining.
  const frac = state.time / Whac.WHAC.time;
  ctx.fillStyle = CLOCK_TRACK;
  ctx.fillRect(15, 30, width - 30, 12);
  ctx.fillStyle = frac > 0.25 ? GOLD : RED;
  ctx.fillRect(15, 30, (width - 30) * frac, 12);

  const { x0, y0, cell } = holeGeometry(ctx.canvas);
  state.holes.forEach((up, i) => {
    const cx = x0 + (i % 3) * cell + cell / 2;
    const cy = y0 + Math.floor(i / 3) * cell + cell / 2;

    // The mound.
    ctx.fillStyle = BG;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 34, 54, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    if (up > 0) {
      // The optimist: pops tall, sinks as its ticks run out.
      const rise = Math.min(1, up / 40); // the last third is the sink
      ctx.fillStyle = PURPLE;
      ctx.beginPath();
      ctx.roundRect(cx - 32, cy + 30 - 64 * rise, 64, 64 * rise, 20);
      ctx.fill();
      if (rise > 0.5) {
        ctx.fillStyle = PANEL;
        ctx.fillRect(cx - 16, cy + 30 - 64 * rise + 14, 9, 9);
        ctx.fillRect(cx + 7, cy + 30 - 64 * rise + 14, 9, 9);
      }
    }
  });

  if (state.status === "gameover") {
    drawOverlay(ctx, "TIME UP", `${state.score} points · Enter for another round`);
  }
}
