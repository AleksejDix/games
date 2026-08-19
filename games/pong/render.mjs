// ============================================================================
// render.mjs — Pong's PROJECTION: state → pixels, and nothing else.
// core/ holds the rules, this draws them, game.mjs only wires.
//
// Unlike Snake's renderer this one imports the core — not to change it,
// but to read the same PADDLE/BALL constants the physics uses, so the
// drawing can never disagree with the collision boxes.
// ============================================================================

import * as Pong from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const NET_INK = cssVarAlpha("--text", 0.15);
const COURT_INK = cssVarAlpha("--text", 0.35);

export function render(ctx, state, paused) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  // The net: a dashed center line, drawn as one stroked path.
  ctx.strokeStyle = NET_INK;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scores live ON the court, like the original's segmented digits.
  ctx.fillStyle = COURT_INK;
  ctx.font = "bold 64px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(state.scores.left, width * 0.25, 80);
  ctx.fillText(state.scores.right, width * 0.75, 80);

  // Paddles. The core stores only each paddle's center y; the x positions
  // are derived from the same constants the physics uses.
  ctx.fillStyle = TEXT;
  drawPaddle(ctx, Pong.PADDLE.margin, state.paddles.left.y);
  drawPaddle(
    ctx,
    width - Pong.PADDLE.margin - Pong.PADDLE.width,
    state.paddles.right.y
  );

  // The ball — a square, faithful to 1972.
  const half = Pong.BALL.size / 2;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(state.ball.x - half, state.ball.y - half, Pong.BALL.size, Pong.BALL.size);

  if (paused) drawOverlay(ctx, "PAUSED", "Space to resume");
  if (state.status === "gameover") {
    const winner = state.scores.left > state.scores.right ? "YOU WIN" : "CPU WINS";
    drawOverlay(ctx, winner, "Enter to play again");
  }
}

function drawPaddle(ctx, x, centerY) {
  ctx.fillRect(
    x,
    centerY - Pong.PADDLE.height / 2,
    Pong.PADDLE.width,
    Pong.PADDLE.height
  );
}
