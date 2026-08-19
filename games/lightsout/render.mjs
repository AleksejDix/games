// ============================================================================
// render.mjs — Lights Out's PROJECTION: a 5×5 board of lamps, the lit
// ones glowing gold. Darkness is the goal, so the win screen is dark.
// ============================================================================

import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";

const BG = cssVar("--bg");
const GOLD = cssVar("--gold");

export function render(ctx, state, paused) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  const cell = width / state.size;
  const pad = cell * 0.07;

  state.grid.forEach((lit, i) => {
    const x = (i % state.size) * cell + pad;
    const y = Math.floor(i / state.size) * cell + pad;
    ctx.fillStyle = lit ? GOLD : BG;
    ctx.beginPath();
    ctx.roundRect(x, y, cell - pad * 2, cell - pad * 2, 12);
    ctx.fill();
  });

  if (state.status === "solved") {
    drawOverlay(ctx, "DARKNESS", `in ${state.moves} presses · Enter for new lights`);
  }
}
