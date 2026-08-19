// ============================================================================
// render.mjs — Frogger's PROJECTION: the crossing as colored bands —
// river up top, road below — with logs, traffic, home bays, and one
// determined frog.
// ============================================================================

import * as Frog from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";

const BG = cssVar("--bg");
const PANEL = cssVar("--panel");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");
const RED = cssVar("--red");
const CYAN = cssVar("--cyan");
const ORANGE = cssVar("--orange");
const PURPLE = cssVar("--purple");
const RIVER_SHEEN = cssVarAlpha("--cyan", 0.14);

const CAR_COLORS = { 7: RED, 8: GOLD, 9: PURPLE, 10: CYAN, 11: RED };

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  const cell = Frog.CELL;

  // The bands: water, median, road, curbs.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = RIVER_SHEEN; // the river's sheen
  ctx.fillRect(0, cell, width, cell * 5);
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, cell * 6, width, cell); // the median
  ctx.fillRect(0, height - cell, width, cell); // the start curb

  // Home bays.
  Frog.HOME_XS.forEach((hx, i) => {
    ctx.fillStyle = state.homes[i] ? ACCENT : PANEL;
    ctx.beginPath();
    ctx.roundRect(hx - 26, 6, 52, cell - 12, 8);
    ctx.fill();
  });

  // The lanes: logs on the river, traffic on the road.
  state.lanes.forEach((lane, row) => {
    if (!lane) return;
    const y = row * cell + 6;
    const river = Frog.RIVER_ROWS.includes(row);
    ctx.fillStyle = river ? ORANGE : CAR_COLORS[row] ?? RED;
    for (const item of lane.items) {
      ctx.beginPath();
      ctx.roundRect(item.x - lane.w / 2, y, lane.w, cell - 12, river ? 14 : 6);
      ctx.fill();
    }
  });

  // The frog.
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(state.frog.x, state.frog.row * cell + cell / 2, Frog.FROG.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.fillRect(state.frog.x - 6, state.frog.row * cell + cell / 2 - 8, 4, 4);
  ctx.fillRect(state.frog.x + 2, state.frog.row * cell + cell / 2 - 8, 4, 4);

  if (state.status === "gameover") {
    drawOverlay(ctx, "GAME OVER", `${state.score} points · Enter to hop again`);
  }
}
