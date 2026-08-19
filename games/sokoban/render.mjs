// ============================================================================
// render.mjs — Sokoban's PROJECTION: state → pixels, and nothing else.
//
// Simple geometry carries all the reading: walls are panels with a faint
// lit top edge, goals are quiet dots, and a box CHANGES COLOR the moment
// it lands home — gold in transit, accent green parked — so progress
// needs no counter (Fifteen's glowing home tiles, again). The keeper's
// notch points the way of his last step.
// ============================================================================

import { DIRS, LEVELS, deadBoxes } from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { boardGeometry } from "../../shared/board.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
const BG = cssVar("--bg");
const WALL = cssVar("--panel");
const WALL_EDGE = cssVarAlpha("--text", 0.12); // the light on a block's top-left
const WALL_BASE = cssVarAlpha("--bg", 0.55); // the shade under its bottom-right
const GOAL = cssVarAlpha("--accent", 0.6);
const BOX = cssVar("--gold");
const BOX_HOME = cssVar("--accent");
const KEEPER = cssVar("--cyan");
const DANGER = cssVar("--red"); // a cornered crate, past saving

const SEAMS = cssVarAlpha("--bg", 0.45); // plank joints and braces, cut into the wood
const GRAIN = cssVarAlpha("--text", 0.18); // the light along a crate's top plank

const INSET = 0.12; // box margin, as a fraction of a cell

// A wooden CRATE, not a rounded blob: outer frame, an X of cross-braces,
// and corner blocks — the three strokes every crate ever drawn is made
// of. Gold pine in transit, accent-stained the moment it parks; the
// color signal stays, the carpentry is new.
function drawCrate(ctx, x, y, size, parked, dead = false) {
  const brace = Math.max(2, size * 0.09);

  ctx.fillStyle = dead ? DANGER : parked ? BOX_HOME : BOX;
  ctx.fillRect(x, y, size, size);

  // The light catches the top plank.
  ctx.fillStyle = GRAIN;
  ctx.fillRect(x, y, size, brace);

  // Frame and cross-braces, cut in as seams.
  ctx.strokeStyle = SEAMS;
  ctx.lineWidth = brace;
  ctx.strokeRect(x + brace / 2, y + brace / 2, size - brace, size - brace);
  ctx.beginPath();
  ctx.moveTo(x + brace, y + brace);
  ctx.lineTo(x + size - brace, y + size - brace);
  ctx.moveTo(x + size - brace, y + brace);
  ctx.lineTo(x + brace, y + size - brace);
  ctx.stroke();

  // Corner blocks, where the nails would go.
  ctx.fillStyle = SEAMS;
  const block = brace * 1.4;
  for (const [bx, by] of [[x, y], [x + size - block, y], [x, y + size - block], [x + size - block, y + size - block]]) {
    ctx.fillRect(bx, by, block, block);
  }
}

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);

  // Each level brings its own dimensions; the geometry centers the grid.
  const { cell, x0, y0 } = boardGeometry(ctx.canvas, state.cols, state.rows);
  const at = (i) => [x0 + (i % state.cols) * cell, y0 + Math.floor(i / state.cols) * cell];

  // Walls are BLOCKS, not stripes: each cell is its own slab, set off by
  // a mortar seam of background, lit along the top-left and shadowed at
  // the base — simple geometry doing masonry's whole job.
  const seam = Math.max(1, cell * 0.04);
  const bevel = Math.max(2, cell * 0.1);
  state.walls.forEach((wall, i) => {
    if (!wall) return;
    const [x, y] = at(i);
    const bx = x + seam;
    const by = y + seam;
    const bs = cell - seam * 2;
    ctx.fillStyle = WALL;
    ctx.fillRect(bx, by, bs, bs);
    ctx.fillStyle = WALL_EDGE;
    ctx.fillRect(bx, by, bs, bevel); // lit top
    ctx.fillRect(bx, by, bevel, bs); // lit left
    ctx.fillStyle = WALL_BASE;
    ctx.fillRect(bx, by + bs - bevel, bs, bevel); // shadowed base
    ctx.fillRect(bx + bs - bevel, by, bevel, bs); // shadowed right
  });

  ctx.fillStyle = GOAL;
  state.goals.forEach((goal, i) => {
    if (!goal) return;
    const [x, y] = at(i);
    ctx.beginPath();
    ctx.arc(x + cell / 2, y + cell / 2, cell * 0.1, 0, Math.PI * 2);
    ctx.fill();
  });

  // A dead crate wears the danger stain — the rules' own verdict, drawn.
  const dead = new Set(deadBoxes(state));
  for (const box of state.boxes) {
    const [x, y] = at(box);
    const inset = cell * INSET;
    drawCrate(ctx, x + inset, y + inset, cell - inset * 2, state.goals[box], dead.has(box));
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
    const next =
      state.level < LEVELS.length - 1 ? "Enter for the next room" : "Enter to replay";
    drawOverlay(ctx, "SOLVED", `${state.moves} moves, ${state.pushes} pushes · ${next}`);
  }
}
