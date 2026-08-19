// ============================================================================
// render.mjs — Lunar Lander's PROJECTION: state → pixels, and nothing else.
//
// New rendering idea: INSTRUMENTS. A pilot can't judge 24 units/second by
// eye, so the panel shows speed and tilt — and turns green exactly when
// the core's landing rules would accept them. The HUD teaches the rules.
// ============================================================================

import * as Lander from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");
const RED = cssVar("--red");

export function render(ctx, state, paused) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineWidth = 1.5;

  drawTerrain(ctx, state);
  if (state.status !== "crashed") drawShip(ctx, state);
  drawInstruments(ctx, state);

  if (paused) drawOverlay(ctx, "PAUSED", "Space to resume");
  if (state.status === "landed") {
    drawOverlay(ctx, "THE EAGLE HAS LANDED", `fuel bonus ${state.score} · Enter for a new moon`);
  }
  if (state.status === "crashed") {
    drawOverlay(ctx, "CRASHED", "Enter for a new moon");
  }
}

function drawTerrain(ctx, state) {
  const pts = state.terrain;

  // The ground, one stroked ridge line.
  ctx.strokeStyle = TEXT;
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  // Pads glow: re-stroke every LEVEL segment — the same rule the landing
  // check uses, so what looks safe IS safe.
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i].y !== pts[i + 1].y) continue;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }
  ctx.lineWidth = 1.5;
}

function drawShip(ctx, state) {
  const ship = state.ship;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle); // +x is the ship's facing

  ctx.strokeStyle = TEXT;
  ctx.beginPath();
  ctx.moveTo(10, 0); // nose
  ctx.lineTo(-6, 7);
  ctx.lineTo(-9, 10); // landing struts
  ctx.moveTo(-6, 7);
  ctx.lineTo(-6, -7);
  ctx.lineTo(-9, -10);
  ctx.moveTo(-6, -7);
  ctx.lineTo(10, 0);
  ctx.stroke();

  if (state.thrusting) {
    ctx.strokeStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(-6, 3);
    ctx.lineTo(-13, 0);
    ctx.lineTo(-6, -3);
    ctx.stroke();
  }

  ctx.restore();
}

function drawInstruments(ctx, state) {
  const ship = state.ship;

  // Fuel bar.
  const frac = state.fuel / Lander.SHIP.fuel;
  ctx.fillStyle = "rgba(230, 230, 230, 0.25)";
  ctx.fillRect(16, 16, 120, 8);
  ctx.fillStyle = frac > 0.25 ? ACCENT : RED;
  ctx.fillRect(16, 16, 120 * Math.min(1, frac), 8);

  // Speed and tilt, green exactly when the struts would hold.
  const speed = Math.hypot(ship.vx, ship.vy);
  const tilt = Math.abs(ship.angle - -Math.PI / 2);
  ctx.textAlign = "left";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillStyle = speed <= Lander.SHIP.maxLandSpeed ? ACCENT : TEXT;
  ctx.fillText(`speed ${speed.toFixed(0)}`, 16, 44);
  ctx.fillStyle = tilt <= Lander.SHIP.maxLandTilt ? ACCENT : TEXT;
  ctx.fillText(`tilt ${(tilt * 57.3).toFixed(0)}°`, 16, 60);
}
