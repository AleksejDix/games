// ============================================================================
// render.mjs — the Chrome Dino's PROJECTION: state → pixels, and nothing
// else. The sprites ARE the original's pixels (see sprites.mjs), stamped
// at natural scale onto the original's 600×150 court, in one ink. Each
// map is pre-rendered once to an offscreen stamp; frames are drawImage.
// ============================================================================

import * as Dino from "./logic.mjs";
import {
  RUN1, RUN2, DUCK1, DUCK2, CACTUS_SMALL, CACTUS_LARGE, BIRD1, BIRD2,
  HORIZON1, HORIZON2,
} from "./sprites.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";

const INK = cssVar("--text");
const GRIT = cssVarAlpha("--text", 0.25);

const G = Dino.GROUND_Y;

// A sprite map becomes a stamp: drawn once here, drawImage ever after.
function stamp(rows) {
  const c = document.createElement("canvas");
  c.width = rows[0].length;
  c.height = rows.length;
  const ctx = c.getContext("2d");
  ctx.fillStyle = INK;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "#") ctx.fillRect(x, y, 1, 1);
    }
  });
  return c;
}

const STAMPS = {
  run: [stamp(RUN1), stamp(RUN2)],
  duck: [stamp(DUCK1), stamp(DUCK2)],
  cactusSmall: stamp(CACTUS_SMALL),
  cactusLarge: stamp(CACTUS_LARGE),
  bird: [stamp(BIRD1), stamp(BIRD2)],
  horizon: [stamp(HORIZON1), stamp(HORIZON2)],
};

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);
  // Nearest-neighbor for the stamps: the sprites scale CHUNKY, the way
  // pixel art should — the hi-res backing would otherwise smooth them.
  ctx.imageSmoothingEnabled = false;

  drawGround(ctx, state, width);
  for (const o of state.obstacles) {
    const sx = o.x - state.distance;
    if (sx > width || sx + o.w < 0) continue;
    o.type === "pterodactyl" ? drawBird(ctx, state, sx, o) : drawCactus(ctx, sx, o);
  }
  drawDino(ctx, state);
  drawScore(ctx, state, width);

  if (state.status === "ready") {
    drawOverlay(ctx, "CHROME DINO", "jump to start · Space/↑ jump · ↓ duck");
  }
  if (paused) drawOverlay(ctx, "PAUSED", "P to resume");
  if (state.status === "gameover") {
    drawOverlay(ctx, "G A M E  O V E R", `${state.score} · Enter to run again`);
  }
}

// The ORIGINAL's ground: a 600×12 terrain strip (line, bumps, dips, and
// grit baked into the sprite) at y 127, scrolled by the world's own
// distance and alternating its two bump variants per segment — it passes
// BEHIND the T-rex's legs, exactly like the error page.
function drawGround(ctx, state, width) {
  const off = state.distance % 600;
  const seg = Math.floor(state.distance / 600);
  for (let k = 0; k * 600 - off < width; k++) {
    ctx.drawImage(STAMPS.horizon[(seg + k) % 2], k * 600 - off, Dino.LIFT + 127);
  }
}

// All stances share one anchor: every frame is a full 47-tall map, the
// duck's empty sky rows included — exactly how the original's sheet
// stores them.
function drawDino(ctx, state) {
  const { elev, ducking } = state.dino;
  const frame = Math.floor(state.distance / 30) % 2; // ~12fps at the opening speed
  const image = ducking
    ? STAMPS.duck[frame]
    : elev > 0 ? STAMPS.run[0] : STAMPS.run[frame];
  ctx.drawImage(image, Dino.DINO.x, G - 47 - elev);
}

function drawCactus(ctx, sx, o) {
  const image = o.type === "cactusLarge" ? STAMPS.cactusLarge : STAMPS.cactusSmall;
  const each = o.w / o.size;
  for (let i = 0; i < o.size; i++) {
    ctx.drawImage(image, sx + i * each, o.y);
  }
}

function drawBird(ctx, state, sx, o) {
  // The flap is distance-driven, so it freezes honestly with the world.
  const frame = Math.floor(state.distance / 40) % 2;
  ctx.drawImage(STAMPS.bird[frame], sx, o.y + 4); // art centered in its hitbox
}

// The odometer, top right, zero-padded to five — the original's meter.
function drawScore(ctx, state, width) {
  ctx.fillStyle = state.status === "ready" ? GRIT : INK;
  ctx.textAlign = "right";
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillText(String(state.score).padStart(5, "0"), width - 10, 18);
}
