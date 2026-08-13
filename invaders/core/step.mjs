// One tick of Space Invaders.
//
// Two time models share this function: the cannon, laser, and bombs move
// CONTINUOUSLY every tick (velocity × DT, like Pong), while the fleet
// moves DISCRETELY — one jump whenever its timer runs out (like Snake's
// grid hops). Input: { move: -1..1, fire: bool }.

import { DT, CANNON, LASER, FLEET, BOMBS, BUNKERS } from "./constants.mjs";
import { createFleet, invaderRect, marchTicks } from "./state.mjs";
import { transition } from "./machine.mjs";
import { clamp } from "../../shared/math.mjs";

// AABB overlap — Breakout's rectangles again, minus the bouncing: shots
// don't reflect, they destroy.
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const laserRect = (l) => ({ x: l.x - LASER.width / 2, y: l.y, w: LASER.width, h: LASER.height });
const bombRect = (b) => ({ x: b.x - BOMBS.width / 2, y: b.y, w: BOMBS.width, h: BOMBS.height });
const blockRect = (bl) => ({ x: bl.x, y: bl.y, w: BUNKERS.block, h: BUNKERS.block });
const cannonRect = (state) => ({
  x: state.cannon.x - CANNON.width / 2,
  y: CANNON.y - CANNON.height / 2,
  w: CANNON.width,
  h: CANNON.height,
});

// One march jump. The whole fleet is one origin, so this is a few
// assignments no matter how many invaders survive. Edges are computed
// from the SURVIVORS' outermost columns — a thinned fleet swings wider.
function marchOnce(state, events) {
  const cols = state.invaders.map((i) => i.col);
  const right = state.fleet.x + Math.max(...cols) * FLEET.spacingX + FLEET.width;
  const left = state.fleet.x + Math.min(...cols) * FLEET.spacingX;
  const crossing =
    state.fleet.dir > 0
      ? right + FLEET.stepX > state.width - FLEET.margin
      : left - FLEET.stepX < FLEET.margin;

  if (crossing) {
    // The drop jump: down a row, turn around, no sideways move.
    state.fleet.y += FLEET.dropY;
    state.fleet.dir *= -1;
  } else {
    state.fleet.x += state.fleet.dir * FLEET.stepX;
  }
  // The note payload cycles 0..3 — the shell plays the famous four-step
  // bassline with it, so the music IS the march tempo.
  events.push({ type: "march", note: state.fleet.note });
  state.fleet.note = (state.fleet.note + 1) % 4;
  state.fleet.timer = marchTicks(state);
}

function fleetBottom(state) {
  const rows = state.invaders.map((i) => i.row);
  return state.fleet.y + Math.max(...rows) * FLEET.spacingY + FLEET.height;
}

export function step(state, input = {}) {
  if (state.status !== "playing") return [];

  const events = [];

  if (state.invulnerable > 0) state.invulnerable -= 1;

  // --- the cannon --------------------------------------------------------------
  const move = clamp(input.move ?? 0, -1, 1);
  if (move) {
    const half = CANNON.width / 2;
    state.cannon.x = clamp(
      state.cannon.x + move * CANNON.speed * DT,
      half,
      state.width - half
    );
  }

  // The classic constraint: ONE laser in the air. No cooldown needed —
  // the previous shot must land or leave before the next exists, which
  // also means missing has a price: a long wait while it flies away.
  if (input.fire && !state.laser) {
    state.laser = {
      x: state.cannon.x,
      y: CANNON.y - CANNON.height / 2 - LASER.height,
    };
    events.push({ type: "fired" });
  }

  if (state.laser) {
    state.laser.y -= LASER.speed * DT;
    if (state.laser.y + LASER.height < 0) state.laser = null;
  }

  // --- the march -----------------------------------------------------------------
  state.fleet.timer -= 1;
  if (state.fleet.timer <= 0 && state.invaders.length > 0) {
    marchOnce(state, events);
    // The invasion: the fleet reaching the cannon's rail is the loss no
    // amount of lives survives.
    if (fleetBottom(state) >= CANNON.y - CANNON.height / 2) {
      transition(state, "gameover");
      events.push({ type: "died", cause: "invasion" });
      return events;
    }
  }

  // --- bombs ------------------------------------------------------------------------
  // Chance-per-tick keeps the rain rate independent of tick length; only
  // the bottom-most invader of a column has a clear line to drop.
  if (state.invaders.length > 0 && state.random() < state.bombRate * DT) {
    const pick = state.invaders[Math.floor(state.random() * state.invaders.length)];
    const bottom = state.invaders
      .filter((i) => i.col === pick.col)
      .reduce((low, i) => (i.row > low.row ? i : low));
    const r = invaderRect(state, bottom);
    state.bombs.push({ x: r.x + r.w / 2, y: r.y + r.h });
  }
  for (const b of state.bombs) b.y += BOMBS.speed * DT;
  state.bombs = state.bombs.filter((b) => b.y < state.height);

  // --- the laser lands ------------------------------------------------------------
  if (state.laser) {
    const lr = laserRect(state.laser);
    const target = state.invaders.findIndex((i) => overlaps(lr, invaderRect(state, i)));
    if (target !== -1) {
      const invader = state.invaders[target];
      state.invaders.splice(target, 1);
      state.score += FLEET.points[invader.row];
      state.laser = null;
      events.push({
        type: "invaderHit",
        row: invader.row,
        points: FLEET.points[invader.row],
        remaining: state.invaders.length,
      });
    } else {
      const block = state.blocks.findIndex((bl) => overlaps(lr, blockRect(bl)));
      if (block !== -1) {
        // Your own bunker eats your shot — cover cuts both ways.
        state.blocks.splice(block, 1);
        state.laser = null;
        events.push({ type: "bunkerHit" });
      }
    }
  }

  // Fleet cleared → the next wave, starting one drop lower (capped) — the
  // pressure ratchets across waves as well as within them.
  if (state.invaders.length === 0) {
    state.wave += 1;
    state.invaders = createFleet();
    state.fleet.x = FLEET.left;
    state.fleet.y = FLEET.top + Math.min(state.wave - 1, 3) * FLEET.dropY;
    state.fleet.dir = 1;
    state.fleet.timer = marchTicks(state);
    events.push({ type: "wave", number: state.wave });
  }

  // --- bombs land -------------------------------------------------------------------
  for (let i = state.bombs.length - 1; i >= 0; i--) {
    const br = bombRect(state.bombs[i]);

    const block = state.blocks.findIndex((bl) => overlaps(br, blockRect(bl)));
    if (block !== -1) {
      state.blocks.splice(block, 1);
      state.bombs.splice(i, 1);
      events.push({ type: "bunkerHit" });
      continue;
    }

    if (state.invulnerable === 0 && overlaps(br, cannonRect(state))) {
      state.bombs.splice(i, 1);
      state.lives -= 1;
      if (state.lives <= 0) {
        transition(state, "gameover");
        events.push({ type: "died", cause: "shot" });
        return events;
      }
      state.invulnerable = CANNON.shield;
      events.push({ type: "cannonHit", livesLeft: state.lives });
    }
  }

  return events;
}
