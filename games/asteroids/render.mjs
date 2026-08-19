// ============================================================================
// render.mjs — Asteroids' PROJECTION: state → pixels, and nothing else.
//
// New rendering idea: CANVAS TRANSFORMS. Instead of computing every rotated
// vertex ourselves, we move the canvas — translate to the entity, rotate by
// its angle, draw in the entity's own coordinate frame (nose = +x), and
// restore. save/restore brackets keep each entity's transform from leaking
// into the next. Everything is stroked outlines: vector graphics, faithful
// to the 1979 vector-monitor original.
// ============================================================================

import * as Asteroids from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, blink, cssVarAlpha } from "../../shared/theme.mjs";

// Colors come from the CSS palette — the canvas and the page share a theme.
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");
const GOLD = cssVar("--gold");
const WAVE_INK = cssVarAlpha("--text", 0.25);

export function render(ctx, state, paused) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineWidth = 1.5;

  // The ship blinks while shielded — same trick as Snake's bonus warning,
  // driven by the tick counter so it pulses at simulation speed.
  if (state.status === "playing" && blink(state.invulnerable)) {
    drawShip(ctx, state);
  }

  ctx.strokeStyle = TEXT;
  for (const a of state.asteroids) drawAsteroid(ctx, a);

  ctx.fillStyle = ACCENT;
  for (const b of state.bullets) {
    ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3);
  }

  // Wave marker, faint, out of the way.
  ctx.fillStyle = WAVE_INK;
  ctx.textAlign = "center";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillText(`WAVE ${state.wave}`, ctx.canvas.width / 2, 24);

  if (paused) drawOverlay(ctx, "PAUSED", "P to resume");
  if (state.status === "gameover") drawOverlay(ctx, "GAME OVER", "Enter to restart");
}

// The torus, made visible: an entity within reach of a seam is drawn
// AGAIN on the far side, so a rock straddling an edge shows both halves —
// matching the physics, which can hit it on either. draw(x, y) is called
// once per needed copy (usually one, at a corner up to four).
function drawWrapped(ctx, x, y, reach, draw) {
  const { width, height } = ctx.canvas;
  const xs = [x];
  if (x < reach) xs.push(x + width);
  if (x > width - reach) xs.push(x - width);
  const ys = [y];
  if (y < reach) ys.push(y + height);
  if (y > height - reach) ys.push(y - height);
  for (const px of xs) for (const py of ys) draw(px, py);
}

function drawShip(ctx, state) {
  const ship = state.ship;
  drawWrapped(ctx, ship.x, ship.y, 20, (x, y) => drawShipAt(ctx, state, x, y));
}

function drawShipAt(ctx, state, x, y) {
  const ship = state.ship;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ship.angle); // from here on, +x IS the ship's facing

  ctx.strokeStyle = ACCENT;
  ctx.beginPath();
  ctx.moveTo(14, 0); // nose
  ctx.lineTo(-10, 9); // left fin
  ctx.lineTo(-6, 0); // notch at the tail
  ctx.lineTo(-10, -9); // right fin
  ctx.closePath();
  ctx.stroke();

  // The thruster flame — drawn only when the core says the engine is on.
  if (state.thrusting) {
    ctx.strokeStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(-7, 4);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-7, -4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAsteroid(ctx, a) {
  const r = Asteroids.ASTEROIDS.radii[a.size];
  // Reach covers the bumpiest spoke the shape multipliers can roll.
  drawWrapped(ctx, a.x, a.y, r * 1.5, (x, y) => drawAsteroidAt(ctx, a, r, x, y));
}

function drawAsteroidAt(ctx, a, r, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a.angle);

  // The jagged outline: evenly spaced spokes, each pushed in or out by the
  // shape multipliers the core rolled at spawn — the rock's fingerprint.
  ctx.beginPath();
  a.shape.forEach((bump, i) => {
    const spoke = (i / a.shape.length) * Math.PI * 2;
    const px = Math.cos(spoke) * r * bump;
    const py = Math.sin(spoke) * r * bump;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}
