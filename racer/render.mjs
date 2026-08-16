// ============================================================================
// render.mjs — Racer's PROJECTION: state → pixels, and nothing else.
//
// The scrolling illusion, made honest: the road is drawn as thin
// horizontal slabs, each asking the core "where is the centerline at THIS
// distance?" — so curves bend on screen exactly as the physics sees them,
// and the lane dashes scroll at true world speed. Speed you can feel is
// just geometry sampled per row.
// ============================================================================

import * as Racer from "./logic.mjs";
import { drawOverlay } from "../shared/overlay.mjs";
import { cssVar } from "../shared/theme.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
const BG = cssVar("--bg");
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");
const RED = cssVar("--red");
const PANEL = cssVar("--panel");
const TRAFFIC_COLORS = ["--red", "--cyan", "--purple", "--orange"].map(cssVar);

const SLAB = 8; // road resolution: one centerline sample per 8 screen px

export function render(ctx, state, paused) {
  const { width, height } = ctx.canvas;

  // Grass: the panel color warmed with a whisper of green.
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(110, 231, 110, 0.06)";
  ctx.fillRect(0, 0, width, height);

  // The road, slab by slab. Rows above the car are AHEAD in the world.
  for (let y = 0; y < height; y += SLAB) {
    const d = state.distance + (Racer.CAR.y - y);
    const center = Racer.centerAt(state, d);
    const half = Racer.ROAD.halfWidth;

    ctx.fillStyle = BG; // asphalt
    ctx.fillRect(center - half, y, half * 2, SLAB);

    ctx.fillStyle = GOLD; // edge lines
    ctx.fillRect(center - half, y, 4, SLAB);
    ctx.fillRect(center + half - 4, y, 4, SLAB);

    // Lane dashes scroll at true world speed — they ARE world positions.
    if (Math.floor(d / 60) % 2 === 0) {
      ctx.fillStyle = "rgba(230, 230, 230, 0.5)";
      ctx.fillRect(center - 2, y, 4, SLAB);
    }

    // The checkpoint banner, visible up the road before you reach it.
    if (Math.abs(d - state.nextCheckpoint) < SLAB) {
      ctx.fillStyle = TEXT;
      for (let x = 0; x < half * 2; x += 16) {
        ctx.fillRect(center - half + x, y, 8, SLAB); // checkered
      }
    }
  }

  // Traffic — color picked by a stable hash of each car's lane.
  for (const t of state.traffic) {
    const y = Racer.CAR.y - (t.d - state.distance);
    if (y < -60 || y > height + 60) continue;
    drawCar(ctx, t.x, y, TRAFFIC_COLORS[Math.abs(Math.floor(t.x)) % TRAFFIC_COLORS.length]);
  }

  // Our car, blinking while the crash shield holds.
  const visible = state.shield === 0 || state.shield % 30 < 20;
  if (visible) drawCar(ctx, state.car.x, Racer.CAR.y, ACCENT);

  // --- the dashboard ---------------------------------------------------------
  ctx.textAlign = "center";
  ctx.font = "bold 32px ui-monospace, monospace";
  ctx.fillStyle = state.time < 10 ? RED : TEXT;
  ctx.fillText(Math.ceil(state.time), width / 2, 44);

  ctx.textAlign = "left";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillStyle = "rgba(230, 230, 230, 0.6)";
  ctx.fillText(`${Math.round(state.speed)} km/h`, 16, height - 16);

  if (paused) drawOverlay(ctx, "PAUSED", "Space to resume");
  if (state.status === "gameover") {
    drawOverlay(ctx, "TIME UP", `${state.passes} cars passed · Enter to race again`);
  }
}

function drawCar(ctx, x, y, color) {
  const w = Racer.CAR.width;
  const h = Racer.CAR.height;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
  ctx.fill();
  // Windshield and rear window, punched out in the panel color.
  ctx.fillStyle = PANEL;
  ctx.fillRect(x - w / 2 + 4, y - h / 2 + 8, w - 8, 7);
  ctx.fillRect(x - w / 2 + 4, y + h / 2 - 12, w - 8, 5);
}
