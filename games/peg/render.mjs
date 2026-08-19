// ============================================================================
// render.mjs — Peg Solitaire's PROJECTION. The picked-up peg glows, and
// its legal landings are hinted with rings — the hint asks the core's
// own legalTargets, so it can never mislead.
// ============================================================================

import * as Peg from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { disc, ring } from "../../shared/draw.mjs";

const BG = cssVar("--bg");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);
  const geom = boardGeometry(ctx.canvas, Peg.SIZE);
  const { cell } = geom;
  const targets = state.selected !== null ? Peg.legalTargets(state, state.selected) : [];

  state.board.forEach((v, i) => {
    if (v === null) return; // off the cross
    const { x, y } = geom.center(i);

    disc(ctx, x, y, cell * 0.36, BG); // the hole

    if (v) {
      disc(ctx, x, y, cell * 0.27, i === state.selected ? GOLD : ACCENT);
    } else if (targets.includes(i)) {
      ring(ctx, x, y, cell * 0.27, 3, GOLD); // a legal landing, ringed
    }
  });

  if (state.status === "solved") {
    drawOverlay(ctx, "ONE PEG", state.board[24] ? "and in the center — perfection · Enter" : "solved · Enter for a new board");
  }
  if (state.status === "stuck") {
    drawOverlay(ctx, "STUCK", `${state.pegs} pegs, no moves · Enter to try again`);
  }
}
