// ============================================================================
// render.mjs — Tetris' PROJECTION: state → pixels, and nothing else.
// The well on the left, the dossier (NEXT, level, lines) on the right,
// and the GHOST — an outline where the piece would land, asking the core's
// own ghostY() so the hint can never lie.
// ============================================================================

import * as Tetris from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";

const TEXT = cssVar("--text");
const BG = cssVar("--bg");
const GHOST_INK = cssVarAlpha("--text", 0.25);
const HUD_INK = cssVarAlpha("--text", 0.5);
// One color per tetromino, indexed as the well remembers them (1–7).
const COLORS = ["--cyan", "--gold", "--purple", "--accent", "--red", "--text", "--orange"]
  .map(cssVar);

const CELL = 24;
const WELL_W = Tetris.WELL.cols * CELL; // 240
const PANEL_X = WELL_W + 16;

export function render(ctx, state, paused) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  // The well's ground.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WELL_W, height);

  // Locked cells — the well remembers which piece left each one.
  state.well.forEach((cell, i) => {
    if (cell === 0) return;
    drawCell(ctx, i % Tetris.WELL.cols, Math.floor(i / Tetris.WELL.cols), COLORS[cell - 1]);
  });

  if (state.status === "playing") {
    // The ghost: where the piece would land, from the core's own answer.
    const ghost = { ...state.piece, y: Tetris.ghostY(state) };
    ctx.strokeStyle = GHOST_INK;
    ctx.lineWidth = 2;
    for (const [x, y] of Tetris.pieceCells(ghost)) {
      if (y >= 0) ctx.strokeRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
    }

    // The falling piece.
    const color = COLORS[Tetris.TYPES.indexOf(state.piece.type)];
    for (const [x, y] of Tetris.pieceCells(state.piece)) {
      if (y >= 0) drawCell(ctx, x, y, color);
    }
  }

  // --- the dossier ------------------------------------------------------------
  ctx.textAlign = "left";
  ctx.fillStyle = HUD_INK;
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillText("NEXT", PANEL_X, 28);
  ctx.fillText("LEVEL", PANEL_X, 150);
  ctx.fillText("LINES", PANEL_X, 210);

  ctx.fillStyle = TEXT;
  ctx.font = "bold 22px ui-monospace, monospace";
  ctx.fillText(state.level, PANEL_X, 178);
  ctx.fillText(state.lines, PANEL_X, 238);

  // The preview, drawn in a little private grid.
  const preview = { type: state.next, rot: 0, x: 0, y: 0 };
  const color = COLORS[Tetris.TYPES.indexOf(state.next)];
  for (const [x, y] of Tetris.pieceCells(preview)) {
    ctx.fillStyle = color;
    ctx.fillRect(PANEL_X + x * 20, 44 + y * 20, 18, 18);
  }

  if (paused) drawOverlay(ctx, "PAUSED", "P to resume");
  if (state.status === "gameover") {
    drawOverlay(ctx, "GAME OVER", `${state.lines} lines · Enter to restart`);
  }
}

function drawCell(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}
