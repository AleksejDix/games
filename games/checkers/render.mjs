// ============================================================================
// render.mjs — Checkers' PROJECTION: state → pixels, and nothing else.
//
// The hints query the core's own legalMoves (Peg's pattern): a glowing
// destination IS a legal destination, and the forced-capture rule shows
// itself — when a jump exists, the quiet moves simply don't light up.
// state.selected is the SHELL's cosmetic state (which piece is in hand),
// written beside the core state like Simon's lit pad.
// ============================================================================

import * as Checkers from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { disc, ring, cellRing, hintDots } from "../../shared/draw.mjs";

const BG = cssVar("--bg");
const PANEL = cssVar("--panel");
const RED = cssVar("--red");
const IVORY = cssVar("--text");
const ACCENT = cssVar("--accent");
const HINT = cssVarAlpha("--accent", 0.5);

const PIECE_INK = { red: RED, white: IVORY };

export function render(ctx, state, paused) {
  const geom = boardGeometry(ctx.canvas, Checkers.SIZE);
  const { cell, x0, y0 } = geom;

  for (let r = 0; r < Checkers.SIZE; r++) {
    for (let c = 0; c < Checkers.SIZE; c++) {
      ctx.fillStyle = Checkers.playable(r, c) ? PANEL : BG;
      ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell);
    }
  }

  // The piece in hand (or locked mid-chain) glows; its landings dot.
  const held = state.chained ?? state.selected;
  const targets = held === null || held === undefined ? [] : Checkers.legalMoves(state, held);

  state.cells.forEach((piece, i) => {
    if (!piece) return;
    const { x, y } = geom.center(i);

    disc(ctx, x, y, cell * 0.36, PIECE_INK[piece.side]);

    if (piece.king) {
      // The crown: a contrasting double ring — royalty at a glance.
      const w = Math.max(2, cell * 0.05);
      ring(ctx, x, y, cell * 0.22, w, BG);
      ring(ctx, x, y, cell * 0.1, w, BG);
    }

    if (i === held) cellRing(ctx, geom, i, ACCENT);
  });

  hintDots(ctx, geom, targets.map((t) => t.to), HINT);

  if (state.status === "won") {
    drawOverlay(ctx, `${state.winner.toUpperCase()} WINS`, "Enter for a rematch");
  }
}
