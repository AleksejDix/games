// ============================================================================
// render.mjs — Cave Copter's PROJECTION. The tunnel is sampled per column
// from the core's own centerAt/gapAt — the walls you see are the walls
// that kill. The rotor spins with the distance flown.
// ============================================================================

import * as Copter from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";

const BG = cssVar("--bg");
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");

const SLAB = 8; // one tunnel sample per 8 screen px

export function render(ctx, state, paused) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  // The rock, column by column, asking the core where the tunnel is.
  ctx.fillStyle = BG;
  for (let x = 0; x < width; x += SLAB) {
    const d = state.distance + (x - Copter.SHIP.x);
    const c = Copter.centerAt(state, d);
    const g = Copter.gapAt(state, d);
    ctx.fillRect(x, 0, SLAB, c - g);
    ctx.fillRect(x, c + g, SLAB, height - c - g);
    ctx.fillStyle = ACCENT; // the glowing rims
    ctx.fillRect(x, c - g - 2, SLAB, 2);
    ctx.fillRect(x, c + g, SLAB, 2);
    ctx.fillStyle = BG;
  }

  // The copter: a gold cabin, a tail, and a rotor spun by the meters flown.
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
  ctx.fillStyle = "rgba(230, 230, 230, 0.6)";
  ctx.textAlign = "left";
  ctx.font = "bold 16px ui-monospace, monospace";
  ctx.fillText(`${state.score} m`, 14, 26);

  if (paused) drawOverlay(ctx, "PAUSED", "P to resume");
  if (state.status === "ready") drawOverlay(ctx, "HOLD TO FLY", "press and hold — release to fall");
  if (state.status === "gameover") {
    drawOverlay(ctx, "CRASHED", `${state.score} m into the mountain · Enter to fly again`);
  }
}
