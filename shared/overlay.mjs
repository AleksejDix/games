// The dimmed message overlay (PAUSED / GAME OVER / ...) every game draws.
// It reads the canvas size off the context, so it fits any court — and
// its colors off the palette, like the renderers it dims.

import { cssVar, cssVarAlpha, mono } from "./theme.mjs";
import { courtSize } from "./resolution.mjs";

const SCRIM = cssVarAlpha("--bg", 0.75);
const INK = cssVar("--text");

export function drawOverlay(ctx, title, subtitle) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.fillStyle = SCRIM;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.font = mono(28, true);
  ctx.fillText(title, width / 2, height / 2 - 8);
  ctx.font = mono(14);
  ctx.fillText(subtitle, width / 2, height / 2 + 20);
}
