// ============================================================================
// render.mjs — 2048's PROJECTION. Tiles climb a palette as they double;
// from 128 upward they glow — the summit announces itself.
// ============================================================================

import { BOARD } from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, mono } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";

const BG = cssVar("--bg");
const TEXT = cssVar("--text");
const RAMP = ["--text", "--cyan", "--accent", "--gold", "--orange", "--red", "--purple"].map(cssVar);

function drawTile(ctx, px, py, size, value, scale = 1) {
  const rank = Math.log2(value) - 1; // 2 → 0, 4 → 1, ...
  const color = RAMP[Math.min(rank, RAMP.length - 1)];
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const digits = String(value).length;
  ctx.font = mono(Math.round(size * (digits > 3 ? 0.3 : 0.4) * scale), true);
  ctx.shadowColor = value >= 128 ? color : "transparent";
  ctx.shadowBlur = value >= 128 ? 14 : 0; // the summit glows
  ctx.fillText(value, px + size / 2, py + size / 2 + 2);
  ctx.shadowBlur = 0;
}

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);
  const s = BOARD.size; // the core's board, not a hardcoded four
  const cell = width / s;
  const pad = cell * 0.06;
  const size = cell - pad * 2;
  const corner = (i) => [(i % s) * cell + pad, Math.floor(i / s) * cell + pad];

  // The empty grid, always.
  for (let i = 0; i < s * s; i++) {
    const [x, y] = corner(i);
    ctx.fillStyle = BG;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 10);
    ctx.fill();
  }

  // Mid-tween (state.anim is shell-written presentation, the simon.lit
  // precedent): every surviving tile rides its journey from the slid
  // event; merged values and the spawned tile appear when it lands.
  if (state.anim && state.anim.t < 1) {
    const t = state.anim.t;
    const ease = t * (2 - t); // ease-out — fast start, gentle landing
    for (const move of state.anim.moves) {
      const [fx, fy] = corner(move.from);
      const [tx, ty] = corner(move.to);
      drawTile(ctx, fx + (tx - fx) * ease, fy + (ty - fy) * ease, size, move.value);
    }
  } else {
    state.cells.forEach((value, i) => {
      if (value === 0) return;
      const [x, y] = corner(i);
      // The fresh spawn pops in during its first frames.
      const pop = state.anim?.spawned === i && state.anim.t < 1.4 ? 0.7 : 1;
      drawTile(ctx, x, y, size, value, pop);
    });
  }

  if (state.status === "gameover") {
    drawOverlay(ctx, "FULL BOARD", `${state.score} points, summit ${state.top} · Enter to go again`);
  }
}
