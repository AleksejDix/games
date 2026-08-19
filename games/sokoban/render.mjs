// ============================================================================
// render.mjs — Sokoban's PROJECTION: state → pixels, and nothing else.
//
// Simple geometry carries all the reading: walls are panels with a faint
// lit top edge, goals are quiet dots, and a box CHANGES COLOR the moment
// it lands home — gold in transit, accent green parked — so progress
// needs no counter (Fifteen's glowing home tiles, again). The keeper's
// notch points the way of his last step.
// ============================================================================

import { DIRS } from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { boardGeometry } from "../../shared/board.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
const BG = cssVar("--bg");
const WALL = cssVar("--panel");
const WALL_EDGE = cssVarAlpha("--text", 0.08); // the light catching wall tops
const GOAL = cssVarAlpha("--accent", 0.6);
const BOX = cssVar("--gold");
const BOX_HOME = cssVar("--accent");
const KEEPER = cssVar("--cyan");

const INSET = 0.12; // box margin, as a fraction of a cell

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);

  // Each level brings its own dimensions; the geometry centers the grid.
  const { cell, x0, y0 } = boardGeometry(ctx.canvas, state.cols, state.rows);
  const at = (i) => [x0 + (i % state.cols) * cell, y0 + Math.floor(i / state.cols) * cell];

  state.walls.forEach((wall, i) => {
    if (!wall) return;
    const [x, y] = at(i);
    ctx.fillStyle = WALL;
    ctx.fillRect(x, y, cell, cell);
    ctx.fillStyle = WALL_EDGE;
    ctx.fillRect(x, y, cell, Math.max(2, cell * 0.08));
  });

  ctx.fillStyle = GOAL;
  state.goals.forEach((goal, i) => {
    if (!goal) return;
    const [x, y] = at(i);
    ctx.beginPath();
    ctx.arc(x + cell / 2, y + cell / 2, cell * 0.1, 0, Math.PI * 2);
    ctx.fill();
  });

  for (const box of state.boxes) {
    const [x, y] = at(box);
    const inset = cell * INSET;
    ctx.fillStyle = state.goals[box] ? BOX_HOME : BOX;
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2, cell * 0.14);
    ctx.fill();
  }

  const [kx, ky] = at(state.keeper);
  ctx.fillStyle = KEEPER;
  ctx.beginPath();
  ctx.arc(kx + cell / 2, ky + cell / 2, cell * 0.32, 0, Math.PI * 2);
  ctx.fill();
  // The notch: a bg-colored dot offset the way the keeper last stepped.
  const [dr, dc] = DIRS[state.facing];
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.arc(kx + cell / 2 + dc * cell * 0.16, ky + cell / 2 + dr * cell * 0.16, cell * 0.09, 0, Math.PI * 2);
  ctx.fill();

  if (state.status === "solved") {
    drawOverlay(ctx, "SOLVED", `${state.moves} moves, ${state.pushes} pushes · Enter to replay`);
  }
}
