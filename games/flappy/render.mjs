// ============================================================================
// render.mjs — Flappy's PROJECTION. The bird tilts with its momentum —
// nose up on a flap, beak-first in a dive — which is the entire
// animation budget, and all it needs.
// ============================================================================

import * as Flappy from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";

const BG = cssVar("--bg");
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");
const PANEL = cssVar("--panel");
const SCORE_INK = cssVarAlpha("--text", 0.6);

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);
  const groundY = height - Flappy.GROUND;

  // Pipes, with the classic lips.
  ctx.fillStyle = ACCENT;
  for (const pipe of state.pipes) {
    const x = pipe.x - state.distance;
    if (x > width || x + Flappy.PIPES.width < 0) continue;
    const half = state.gap / 2;
    ctx.fillRect(x, 0, Flappy.PIPES.width, pipe.gapY - half);
    ctx.fillRect(x, pipe.gapY + half, Flappy.PIPES.width, groundY - pipe.gapY - half);
    ctx.fillStyle = BG;
    ctx.fillRect(x - 3, pipe.gapY - half - 14, Flappy.PIPES.width + 6, 4);
    ctx.fillRect(x - 3, pipe.gapY + half + 10, Flappy.PIPES.width + 6, 4);
    ctx.fillStyle = ACCENT;
  }

  // The ground.
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, groundY, width, Flappy.GROUND);
  ctx.fillStyle = BG;
  for (let x = 0; x < width; x += 24) {
    ctx.fillRect(x - ((state.distance * 1.2) % 24), groundY + 6, 12, 4);
  }

  // The bird, tilted by its fate.
  const bird = state.bird;
  ctx.save();
  ctx.translate(Flappy.BIRD.x, bird.y);
  ctx.rotate(Math.max(-0.5, Math.min(0.9, bird.vy / 600)));
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(0, 0, Flappy.BIRD.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PANEL; // the wing
  ctx.beginPath();
  ctx.ellipse(-3, 3, 7, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TEXT; // the eye
  ctx.fillRect(4, -7, 4, 4);
  ctx.restore();

  // The score, big and center, the classic way.
  if (state.status !== "ready") {
    ctx.fillStyle = SCORE_INK;
    ctx.textAlign = "center";
    ctx.font = "bold 44px ui-monospace, monospace";
    ctx.fillText(state.score, width / 2, 80);
  }

  if (paused) drawOverlay(ctx, "PAUSED", "P to resume");
  if (state.status === "ready") drawOverlay(ctx, "TAP TO FLAP", "or press Space");
  if (state.status === "gameover") {
    drawOverlay(ctx, "OOF", `${state.score} pipes · Enter to go again`);
  }
}
