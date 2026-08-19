// ============================================================================
// render.mjs — Simon's PROJECTION. Four pads; the lit one burns bright.
// The real display is the speaker — this is just where you aim.
// ============================================================================

import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";

const PAD_COLORS = ["--accent", "--red", "--gold", "--cyan"].map(cssVar);
const BG = cssVar("--bg");
const TEXT = cssVar("--text");

export function render(ctx, state, paused) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  const half = width / 2;
  const gap = 10;

  PAD_COLORS.forEach((color, pad) => {
    const x = (pad % 2) * half + gap;
    const y = Math.floor(pad / 2) * half + gap;
    ctx.globalAlpha = state.lit === pad ? 1 : 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, half - gap * 2, half - gap * 2, 18);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // The round counter, on a hub like the 1978 disc.
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.arc(half, half, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TEXT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 34px ui-monospace, monospace";
  ctx.fillText(state.score, half, half + 2);

  if (state.status === "gameover") {
    drawOverlay(ctx, `ROUND ${state.score}`, "one wrong note · Enter to try again");
  }
}
