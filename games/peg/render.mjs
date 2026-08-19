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

const BG = cssVar("--bg");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);
  const { cell } = boardGeometry(ctx.canvas, Peg.SIZE);
  const targets = state.selected !== null ? Peg.legalTargets(state, state.selected) : [];

  state.board.forEach((v, i) => {
    if (v === null) return; // off the cross
    const cx = (i % Peg.SIZE) * cell + cell / 2;
    const cy = Math.floor(i / Peg.SIZE) * cell + cell / 2;

    ctx.fillStyle = BG; // the hole
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();

    if (v) {
      ctx.fillStyle = i === state.selected ? GOLD : ACCENT;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.27, 0, Math.PI * 2);
      ctx.fill();
    } else if (targets.includes(i)) {
      ctx.strokeStyle = GOLD; // a legal landing, ringed
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.27, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  if (state.status === "solved") {
    drawOverlay(ctx, "ONE PEG", state.board[24] ? "and in the center — perfection · Enter" : "solved · Enter for a new board");
  }
  if (state.status === "stuck") {
    drawOverlay(ctx, "STUCK", `${state.pegs} pegs, no moves · Enter to try again`);
  }
}
