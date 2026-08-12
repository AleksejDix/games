// ============================================================================
// render.mjs — Breakout's PROJECTION: state → pixels, and nothing else.
// core/ holds the rules, this draws them, game.mjs only wires.
// ============================================================================

import * as Breakout from "./logic.mjs";
import { drawOverlay } from "../shared/overlay.mjs";
import { cssVar } from "../shared/theme.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
// One color per brick row, warm at the top where the points are.
const ROW_COLORS = ["--red", "--orange", "--gold", "--accent", "--cyan", "--purple"].map(cssVar);
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");

export function render(ctx, state, paused) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Bricks: position from state, size from the shared constants, inset a
  // couple of pixels so the wall reads as bricks instead of a slab.
  for (const b of state.bricks) {
    ctx.fillStyle = ROW_COLORS[b.row % ROW_COLORS.length];
    ctx.fillRect(b.x + 2, b.y + 2, Breakout.BRICKS.width - 4, Breakout.BRICKS.height - 4);
  }

  // Paddle.
  ctx.fillStyle = TEXT;
  ctx.fillRect(
    state.paddle.x - state.paddle.width / 2,
    Breakout.PADDLE.y - Breakout.PADDLE.height / 2,
    state.paddle.width,
    Breakout.PADDLE.height
  );

  // Ball.
  const half = Breakout.BALL.size / 2;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(state.ball.x - half, state.ball.y - half, Breakout.BALL.size, Breakout.BALL.size);

  // A gentle prompt while the ball waits on the paddle — small text, not
  // the full overlay: the player is aiming, don't cover the bricks.
  if (state.status === "serving") {
    ctx.fillStyle = "rgba(230, 230, 230, 0.5)";
    ctx.textAlign = "center";
    ctx.font = "14px ui-monospace, monospace";
    ctx.fillText("Space to launch", ctx.canvas.width / 2, Breakout.PADDLE.y - 40);
  }

  if (paused) drawOverlay(ctx, "PAUSED", "Space to resume");
  if (state.status === "gameover") drawOverlay(ctx, "GAME OVER", "Enter to restart");
  if (state.status === "cleared") drawOverlay(ctx, "WALL CLEARED!", "Enter to play again");
}
