// ============================================================================
// render.mjs — Space Invaders' PROJECTION: state → pixels, and nothing else.
//
// The invaders are drawn as chunky rect-sprites with TWO poses, toggled by
// the fleet's note counter — so the animation is locked to the march the
// same way the bassline is: the whole game breathes on one tick.
// ============================================================================

import * as Invaders from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, blink, cssVarAlpha } from "../../shared/theme.mjs";

// Colors come from the CSS palette — but assigned by screen REGION, the
// way the 1978 cabinet did it: the monitor was black-and-white, and the
// color came from cellophane strips glued over zones — green over the
// player's world at the bottom, red up in UFO country, white between.
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const RED = cssVar("--red");
const PANEL = cssVar("--panel");
const WAVE_INK = cssVarAlpha("--text", 0.25);

export function render(ctx, state, paused) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // The fleet — white, pose flipping with the march's note counter.
  const pose = state.fleet.note % 2;
  ctx.fillStyle = TEXT;
  for (const invader of state.invaders) {
    drawInvader(ctx, Invaders.invaderRect(state, invader), pose);
  }

  // The mystery ship, up in the red zone.
  if (state.ufo) {
    ctx.fillStyle = RED;
    const u = Invaders.UFO;
    ctx.fillRect(state.ufo.x + 4, Invaders.UFO.y, u.width - 8, u.height - 6);
    ctx.fillRect(state.ufo.x, Invaders.UFO.y + 4, u.width, u.height - 8);
  }

  // Bunkers: what's left of them, in the green zone.
  ctx.fillStyle = ACCENT;
  for (const bl of state.blocks) {
    ctx.fillRect(bl.x + 1, bl.y + 1, Invaders.BUNKERS.block - 2, Invaders.BUNKERS.block - 2);
  }

  // The cannon — blinking while its shield holds.
  if (state.status === "playing" && blink(state.invulnerable)) {
    const c = Invaders.CANNON;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(state.cannon.x - c.width / 2, c.y - c.height / 2 + 6, c.width, c.height - 6);
    ctx.fillRect(state.cannon.x - 8, c.y - c.height / 2 + 2, 16, 6);
    ctx.fillRect(state.cannon.x - 2, c.y - c.height / 2 - 4, 4, 6); // barrel
  }

  // Shots.
  if (state.laser) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(
      state.laser.x - Invaders.LASER.width / 2,
      state.laser.y,
      Invaders.LASER.width,
      Invaders.LASER.height
    );
  }
  ctx.fillStyle = TEXT;
  for (const b of state.bombs) {
    ctx.fillRect(b.x - Invaders.BOMBS.width / 2, b.y, Invaders.BOMBS.width, Invaders.BOMBS.height);
  }

  // Wave marker, faint, out of the way.
  ctx.fillStyle = WAVE_INK;
  ctx.textAlign = "center";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillText(`WAVE ${state.wave}`, ctx.canvas.width / 2, 24);

  if (paused) drawOverlay(ctx, "PAUSED", "P to resume");
  if (state.status === "gameover") drawOverlay(ctx, "GAME OVER", "Enter to restart");
}

// A chunky two-pose sprite from plain rects: torso, arms that swing up
// and down, feet that step in and out, eyes punched out in the panel
// color. Crude on purpose — 1978 didn't have more pixels either.
function drawInvader(ctx, r, pose) {
  ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); // torso
  if (pose === 0) {
    ctx.fillRect(r.x, r.y + 8, 4, r.h - 12); // arms low
    ctx.fillRect(r.x + r.w - 4, r.y + 8, 4, r.h - 12);
    ctx.fillRect(r.x + 6, r.y + r.h - 4, 4, 4); // feet in
    ctx.fillRect(r.x + r.w - 10, r.y + r.h - 4, 4, 4);
  } else {
    ctx.fillRect(r.x, r.y + 2, 4, r.h - 12); // arms raised
    ctx.fillRect(r.x + r.w - 4, r.y + 2, 4, r.h - 12);
    ctx.fillRect(r.x + 2, r.y + r.h - 4, 4, 4); // feet out
    ctx.fillRect(r.x + r.w - 6, r.y + r.h - 4, 4, 4);
  }
  const color = ctx.fillStyle;
  ctx.fillStyle = PANEL;
  ctx.fillRect(r.x + 9, r.y + 8, 3, 3); // eyes
  ctx.fillRect(r.x + r.w - 12, r.y + 8, 3, 3);
  ctx.fillStyle = color;
}
