// ============================================================================
// render.mjs — Missile Command's PROJECTION: state → pixels, and nothing
// else. Trails are drawn from each projectile's stored launch anchor to
// its head — the sky slowly fills with lines, which IS the atmosphere.
// ============================================================================

import * as Missiles from "./logic.mjs";
import { drawOverlay } from "../shared/overlay.mjs";
import { cssVar } from "../shared/theme.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");
const RED = cssVar("--red");
const CYAN = cssVar("--cyan");
const PANEL = cssVar("--panel");

export function render(ctx, state, paused) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  // The ground.
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, Missiles.GROUND, width, height - Missiles.GROUND);

  for (const city of state.cities) drawCity(ctx, city);
  for (const silo of state.silos) drawSilo(ctx, silo);

  // Enemy trails: the red rain.
  ctx.strokeStyle = RED;
  for (const m of state.missiles) {
    ctx.beginPath();
    ctx.moveTo(m.sx, m.sy);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();
    ctx.fillStyle = TEXT;
    ctx.fillRect(m.x - 1.5, m.y - 1.5, 3, 3); // the warhead
  }

  // Our interceptors.
  ctx.strokeStyle = ACCENT;
  for (const r of state.interceptors) {
    ctx.beginPath();
    ctx.moveTo(r.sx, r.sy);
    ctx.lineTo(r.x, r.y);
    ctx.stroke();
    // The X marks where the round will detonate — the classic tell.
    ctx.strokeRect(r.tx - 2, r.ty - 2, 4, 4);
  }

  // Fireballs: radius from the same sine the physics uses, flickering.
  for (const b of state.blasts) {
    const r = Missiles.blastRadius(b.age);
    ctx.fillStyle = Math.floor(b.age * 24) % 2 === 0 ? GOLD : TEXT;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // The crosshair.
  if (state.status === "playing") {
    ctx.strokeStyle = TEXT;
    ctx.beginPath();
    ctx.moveTo(state.aim.x - 8, state.aim.y);
    ctx.lineTo(state.aim.x + 8, state.aim.y);
    ctx.moveTo(state.aim.x, state.aim.y - 8);
    ctx.lineTo(state.aim.x, state.aim.y + 8);
    ctx.stroke();
  }

  // Wave marker, faint, out of the way.
  ctx.fillStyle = "rgba(230, 230, 230, 0.25)";
  ctx.textAlign = "center";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillText(`WAVE ${state.wave}`, width / 2, 24);

  if (paused) drawOverlay(ctx, "PAUSED", "Space to resume");
  if (state.status === "debrief") {
    drawOverlay(ctx, `WAVE ${state.wave} SURVIVED`, `bonus ${state.lastBonus} · rearming...`);
  }
  if (state.status === "gameover") {
    drawOverlay(ctx, "THE END", "Enter to defend again");
  }
}

function drawCity(ctx, city) {
  const w = Missiles.CITIES.width;
  const h = Missiles.CITIES.height;
  if (city.alive) {
    // A little skyline of three towers.
    ctx.fillStyle = CYAN;
    ctx.fillRect(city.x - w / 2, Missiles.GROUND - h + 5, w, h - 5);
    ctx.fillRect(city.x - w / 2 + 4, Missiles.GROUND - h, 8, h);
    ctx.fillRect(city.x + w / 2 - 14, Missiles.GROUND - h + 2, 8, h);
  } else {
    // Rubble.
    ctx.fillStyle = PANEL;
    ctx.fillRect(city.x - w / 2, Missiles.GROUND - 4, w, 4);
  }
}

function drawSilo(ctx, silo) {
  // A mound with its ammo count on it — no HUD lookup needed mid-battle.
  ctx.fillStyle = silo.alive ? ACCENT : PANEL;
  ctx.beginPath();
  ctx.moveTo(silo.x - 22, Missiles.GROUND);
  ctx.lineTo(silo.x, Missiles.GROUND - 14);
  ctx.lineTo(silo.x + 22, Missiles.GROUND);
  ctx.closePath();
  ctx.fill();
  if (silo.alive) {
    ctx.fillStyle = PANEL;
    ctx.textAlign = "center";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.fillText(silo.ammo, silo.x, Missiles.GROUND - 3);
  }
}
