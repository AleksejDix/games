// ============================================================================
// render.mjs — Minesweeper's PROJECTION. Covered cells sit raised;
// numbers wear the classic escalation of colors; the flags are gold
// beliefs; on the end, the mines confess in red.
// ============================================================================

import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { boardGeometry } from "../../shared/board.mjs";

const BG = cssVar("--bg");
const PANEL = cssVar("--panel");
const TEXT = cssVar("--text");
const GOLD = cssVar("--gold");
const RED = cssVar("--red");
const CELL_EDGE = cssVarAlpha("--text", 0.12);
const NUMBERS = [null, "--cyan", "--accent", "--red", "--purple", "--orange", "--gold", "--text", "--text"]
  .map((v) => (v ? cssVar(v) : null));

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, courtSize(ctx.canvas).height);
  const { cell } = boardGeometry(ctx.canvas, state.size);

  for (let i = 0; i < state.size * state.size; i++) {
    const x = (i % state.size) * cell;
    const y = Math.floor(i / state.size) * cell;

    if (state.revealed[i]) {
      ctx.fillStyle = BG;
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      if (state.mines[i]) {
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.24, 0, Math.PI * 2);
        ctx.fill();
      } else if (state.counts[i] > 0) {
        ctx.fillStyle = NUMBERS[state.counts[i]] ?? TEXT;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${Math.round(cell * 0.45)}px ui-monospace, monospace`;
        ctx.fillText(state.counts[i], x + cell / 2, y + cell / 2 + 1);
      }
    } else {
      ctx.fillStyle = PANEL; // covered: raised
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      ctx.strokeStyle = CELL_EDGE;
      ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
      if (state.flags[i]) {
        ctx.fillStyle = GOLD; // a planted belief
        ctx.beginPath();
        ctx.moveTo(x + cell * 0.35, y + cell * 0.25);
        ctx.lineTo(x + cell * 0.7, y + cell * 0.4);
        ctx.lineTo(x + cell * 0.35, y + cell * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(x + cell * 0.33, y + cell * 0.25, 2, cell * 0.5);
      }
    }
  }

  if (state.status === "solved") drawOverlay(ctx, "SWEPT", "every safe cell found · Enter for a new field");
  if (state.status === "gameover") drawOverlay(ctx, "BOOM", "Enter for a new field");
}
