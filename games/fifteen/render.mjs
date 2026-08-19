// ============================================================================
// render.mjs — Fifteen's PROJECTION: state → pixels, and nothing else.
//
// A quiet teaching hint hides in the colors: a tile already in its home
// cell glows accent green, so progress is visible at a glance — the same
// trick as Lander's instruments, the HUD teaching the rules.
// ============================================================================

import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { boardGeometry } from "../../shared/board.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
const BG = cssVar("--bg");
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");

const GUTTER = 8; // breathing room between tiles

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);

  const { cell } = boardGeometry(ctx.canvas, state.size);

  state.tiles.forEach((tile, i) => {
    if (tile === 0) return; // the gap is the absence of a tile
    const x = (i % state.size) * cell;
    const y = Math.floor(i / state.size) * cell;
    const home = tile === (i + 1) % state.tiles.length;

    ctx.fillStyle = BG;
    ctx.beginPath();
    ctx.roundRect(x + GUTTER / 2, y + GUTTER / 2, cell - GUTTER, cell - GUTTER, 10);
    ctx.fill();

    ctx.fillStyle = home ? ACCENT : TEXT; // home tiles glow
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(cell / 3)}px ui-monospace, monospace`;
    ctx.fillText(tile, x + cell / 2, y + cell / 2 + 2);
  });

  if (state.status === "solved") {
    drawOverlay(ctx, "SOLVED", `in ${state.moves} moves · Enter for a new shuffle`);
  }
}
