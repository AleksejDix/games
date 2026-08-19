// ============================================================================
// render.mjs — Cave Copter's PROJECTION, in the Flash-era dialect: solid
// green rock quantized into chunky steps, a black tunnel, a ribbon of
// smoke puffs, and the floating blocks. Walls and blocks sample the
// core's own centerAt/gapAt — what you see is what kills.
// ============================================================================

import * as Copter from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";

const BG = cssVar("--bg");
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");
const ODOMETER_INK = cssVarAlpha("--text", 0.6);

const SLAB = 32; // chunky columns
const STEP = 16; // wall edges snap to this — the blocky signature

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);

  // The tunnel is darkness carved out of solid green.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = ACCENT;
  for (let x = 0; x < width; x += SLAB) {
    const d = state.distance + (x - Copter.SHIP.x);
    const c = Copter.centerAt(state, d);
    const g = Copter.gapAt(state, d);
    const top = Math.round((c - g) / STEP) * STEP;
    const bottom = Math.round((c + g) / STEP) * STEP;
    ctx.fillRect(x, 0, SLAB, top);
    ctx.fillRect(x, bottom, SLAB, height - bottom);
  }

  // The floating blocks — same green, same menace.
  for (const b of state.blocks) {
    const x = b.d - state.distance + Copter.SHIP.x;
    if (x < -40 || x > width + 40) continue;
    ctx.fillRect(x - Copter.BLOCKS.w / 2, b.y - Copter.BLOCKS.h / 2, Copter.BLOCKS.w, Copter.BLOCKS.h);
  }

  // The smoke: puffs fading along where you just were.
  state.trail.forEach((t, i) => {
    const x = Copter.SHIP.x - (state.distance - t.d);
    ctx.globalAlpha = ((i + 1) / state.trail.length) * 0.45;
    ctx.fillStyle = TEXT;
    ctx.beginPath();
    ctx.arc(x, t.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // The copter: a gold cabin, a tail, a rotor spun by the meters flown.
  ctx.save();
  ctx.translate(Copter.SHIP.x, state.y);
  ctx.rotate(Math.max(-0.35, Math.min(0.35, state.vy / 900)));
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.roundRect(-12, -7, 24, 14, 6);
  ctx.fill();
  ctx.fillRect(-20, -3, 10, 4); // tail boom
  ctx.strokeStyle = TEXT;
  ctx.lineWidth = 2;
  const spin = Math.cos(state.distance / 6) * 14; // the blur of the blades
  ctx.beginPath();
  ctx.moveTo(-spin, -10);
  ctx.lineTo(spin, -10);
  ctx.moveTo(0, -7);
  ctx.lineTo(0, -10);
  ctx.stroke();
  ctx.restore();

  // The odometer.
  ctx.fillStyle = ODOMETER_INK;
  ctx.textAlign = "left";
  ctx.font = "bold 16px ui-monospace, monospace";
  ctx.fillText(`${state.score} m`, 14, 26);

  if (state.status === "ready") drawOverlay(ctx, "HOLD TO FLY", "press and hold — release to fall");
  if (state.status === "gameover") {
    drawOverlay(ctx, "CRASHED", `${state.score} m into the mountain · Enter to fly again`);
  }
}
