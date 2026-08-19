// ============================================================================
// render.mjs — Connect Four's PROJECTION: state → pixels, and nothing else.
//
// The rack is a panel with holes: a panel rectangle, then a bg-colored
// circle punched through every empty cell — the same trick the plastic
// original plays with light. Discs fill the holes in the two house
// colors, and the winning four wear an accent ring so the eye finds
// the line the rules found.
// ============================================================================

import * as Connect from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { disc, cellRing } from "../../shared/draw.mjs";

const BG = cssVar("--bg");
const PANEL = cssVar("--panel");
const RED = cssVar("--red");
const GOLD = cssVar("--gold");
const ACCENT = cssVar("--accent");

const DISC_INK = { red: RED, gold: GOLD };

export function render(ctx, state, paused) {
  const geom = boardGeometry(ctx.canvas, Connect.COLS, Connect.ROWS);
  const { cell, x0, y0 } = geom;

  ctx.fillStyle = PANEL;
  ctx.fillRect(x0, y0, Connect.COLS * cell, Connect.ROWS * cell);

  state.cells.forEach((side, i) => {
    // Empty cells are HOLES: bg shows through, like daylight through
    // the rack. A filled one is a disc in its color.
    const { x, y } = geom.center(i);
    disc(ctx, x, y, cell * 0.38, side ? DISC_INK[side] : BG);
  });

  // The winning four get an accent ring each — the proof, drawn.
  for (const i of state.line ?? []) {
    cellRing(ctx, geom, i, ACCENT, { radius: 0.3 });
  }

  if (state.status === "won") {
    drawOverlay(ctx, `${state.winner.toUpperCase()} WINS`, "Enter for a rematch");
  } else if (state.status === "draw") {
    drawOverlay(ctx, "A DRAW", "Enter for a rematch");
  }
}
