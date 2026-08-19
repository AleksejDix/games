// ============================================================================
// render.mjs — Chess' PROJECTION: state → pixels, and nothing else.
//
// The pieces are the chess glyphs the fonts have carried for decades —
// no sprite work, one fillText per piece, colored from the palette. The
// hints query the core's own legalMoves (the house line since Peg), and
// a king in check wears a red ring the rules themselves computed.
// state.selected is the SHELL's cosmetic state, like Simon's lit pad.
// ============================================================================

import * as Chess from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { boardGeometry } from "../../shared/board.mjs";

const BG = cssVar("--bg");
const PANEL = cssVar("--panel");
const WHITE_INK = cssVar("--text");
const BLACK_INK = cssVar("--cyan");
const ACCENT = cssVar("--accent");
const DANGER = cssVar("--red");
const HINT = cssVarAlpha("--accent", 0.5);

const GLYPHS = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };

export function render(ctx, state, paused) {
  const { cell, x0, y0 } = boardGeometry(ctx.canvas, Chess.SIZE);
  const centre = (i) => [
    x0 + (i % Chess.SIZE) * cell + cell / 2,
    y0 + Math.floor(i / Chess.SIZE) * cell + cell / 2,
  ];

  for (let r = 0; r < Chess.SIZE; r++) {
    for (let c = 0; c < Chess.SIZE; c++) {
      ctx.fillStyle = (r + c) % 2 === 1 ? PANEL : BG;
      ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell);
    }
  }

  const held = state.selected;
  const targets = held === null || held === undefined ? [] : Chess.legalMoves(state, held);

  // The king in check announces itself — the rules' own verdict.
  if (state.status === "playing" && Chess.inCheck(state, state.turn)) {
    const [cx, cy] = centre(Chess.kingIndex(state.cells, state.turn));
    ctx.strokeStyle = DANGER;
    ctx.lineWidth = Math.max(2, cell * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(cell * 0.78)}px serif`;
  state.cells.forEach((piece, i) => {
    if (!piece) return;
    const [cx, cy] = centre(i);
    if (i === held) {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = Math.max(2, cell * 0.05);
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = piece.side === "white" ? WHITE_INK : BLACK_INK;
    ctx.fillText(GLYPHS[piece.type], cx, cy + cell * 0.04);
  });

  ctx.fillStyle = HINT;
  for (const { to } of targets) {
    const [cx, cy] = centre(to);
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.status === "won") {
    drawOverlay(ctx, `${state.winner.toUpperCase()} WINS`, "checkmate · Enter for a rematch");
  }
  if (state.status === "draw") {
    drawOverlay(ctx, "A DRAW", "Enter for a rematch");
  }
}
