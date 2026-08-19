// One tick of Space Invaders.
//
// Two time models share this function: the cannon, laser, and bombs move
// CONTINUOUSLY every tick (velocity × DT, like Pong), while the fleet
// moves DISCRETELY — one jump whenever its timer runs out (like Snake's
// grid hops). Input: { move: -1..1, fire: bool }.

import { DT, CANNON, LASER, FLEET, BOMBS, BUNKERS, UFO, EXTRA_LIFE_AT } from "./constants.mjs";
import { createFleet, invaderRect, marchTicks } from "./state.mjs";
import { transition } from "./machine.mjs";
import { clamp } from "../../../shared/math.mjs";
import { rectsOverlap as overlaps } from "../../../shared/collide.mjs";
import { pick, chance } from "../../../shared/random.mjs";

const laserRect = (l) => ({ x: l.x - LASER.width / 2, y: l.y, w: LASER.width, h: LASER.height });
const bombRect = (b) => ({ x: b.x - BOMBS.width / 2, y: b.y, w: BOMBS.width, h: BOMBS.height });
const blockRect = (bl) => ({ x: bl.x, y: bl.y, w: BUNKERS.block, h: BUNKERS.block });
const cannonRect = (state) => ({
  x: state.cannon.x - CANNON.width / 2,
  y: CANNON.y - CANNON.height / 2,
  w: CANNON.width,
  h: CANNON.height,
});
const ufoRect = (u) => ({ x: u.x, y: UFO.y, w: UFO.width, h: UFO.height });

// The cabinet's one bonus cannon, awarded the moment the score crosses
// the line — from any scoring source.
function grantExtraLife(state, events) {
  if (!state.extraLifeAwarded && state.score >= EXTRA_LIFE_AT) {
    state.extraLifeAwarded = true;
    state.lives += 1;
    events.push({ type: "extraLife" });
  }
}

// What a downed UFO pays. The famous jackpot counter: 300 on the 23rd
// shot fired, then every 15th after; anything else pays from the table.
function ufoValue(state) {
  const s = state.shots;
  const onCount = s === 23 || (s > 23 && (s - 23) % 15 === 0);
  return onCount ? UFO.jackpot : UFO.values[s % UFO.values.length];
}

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
  // The death freeze: after a hit, the whole world stands still for a
  // beat — no marching, no falling, no input — then play resumes with a
  // brief shield. The original's dramatic pause, as a machine state.
  if (state.status === "respawning") {
    state.respawnTimer -= 1;
    if (state.respawnTimer <= 0) {
      transition(state, "playing");
      state.invulnerable = CANNON.shield;
    }
    return [];
  }

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
    state.shots += 1; // the UFO's jackpot counter watches this
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

  // --- the UFO -----------------------------------------------------------------------
  // The saucer visits on a timer — but stays home once the fleet runs
  // thin, like the original.
  if (state.ufo) {
    state.ufo.x += state.ufo.dir * UFO.speed * DT;
    if (state.ufo.x < -UFO.width || state.ufo.x > state.width) state.ufo = null;
  } else if (state.invaders.length >= UFO.minFleet) {
    state.ufoTimer -= 1;
    if (state.ufoTimer <= 0) {
      const fromLeft = state.random() < 0.5;
      state.ufo = { x: fromLeft ? -UFO.width : state.width, dir: fromLeft ? 1 : -1 };
      state.ufoTimer = Math.round(UFO.interval / DT);
      events.push({ type: "ufo" });
    }
  }

  // --- bombs ------------------------------------------------------------------------
  // Chance-per-tick keeps the rain rate independent of tick length, and
  // the sky holds at most BOMBS.max at once. Only the bottom-most invader
  // of a column has a clear line to drop. Three kinds: "rolling" AIMS at
  // the cannon's column; the others pick a random one.
  if (
    state.invaders.length > 0 &&
    state.bombs.length < BOMBS.max &&
    chance(state.random, state.bombRate, DT)
  ) {
    const kind = pick(BOMBS.kinds, state.random);
    let source;
    if (kind === "rolling") {
      source = state.invaders.reduce((best, i) => {
        const dx = (c) => Math.abs(invaderRect(state, c).x + FLEET.width / 2 - state.cannon.x);
        return dx(i) < dx(best) ? i : best;
      });
    } else {
      source = pick(state.invaders, state.random);
    }
    const bottom = state.invaders
      .filter((i) => i.col === source.col)
      .reduce((low, i) => (i.row > low.row ? i : low));
    const r = invaderRect(state, bottom);
    state.bombs.push({ x: r.x + r.w / 2, y: r.y + r.h, kind });
  }
  for (const b of state.bombs) b.y += BOMBS.speed[b.kind] * DT;
  state.bombs = state.bombs.filter((b) => b.y < state.height);

  // --- the fleet chews the bunkers ---------------------------------------------------
  // A descending invader erases any block it touches — cover is temporary.
  if (fleetBottom(state) >= BUNKERS.y) {
    state.blocks = state.blocks.filter(
      (bl) => !state.invaders.some((i) => overlaps(blockRect(bl), invaderRect(state, i)))
    );
  }

  // --- the laser lands ------------------------------------------------------------
  // Checked in the order the laser meets things flying up: a bomb it can
  // shoot out of the air, an invader, the UFO, or — cover cutting both
  // ways — its own bunker.
  if (state.laser) {
    const lr = laserRect(state.laser);

    const bomb = state.bombs.findIndex((b) => overlaps(lr, bombRect(b)));
    const target = bomb === -1
      ? state.invaders.findIndex((i) => overlaps(lr, invaderRect(state, i)))
      : -1;

    if (bomb !== -1) {
      state.bombs.splice(bomb, 1);
      state.laser = null;
      events.push({ type: "bombShot" }); // both projectiles cancel
    } else if (target !== -1) {
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
      grantExtraLife(state, events);
    } else if (state.ufo && overlaps(lr, ufoRect(state.ufo))) {
      const points = ufoValue(state);
      state.score += points;
      state.ufo = null;
      state.laser = null;
      events.push({ type: "ufoHit", points });
      grantExtraLife(state, events);
    } else {
      const block = state.blocks.findIndex((bl) => overlaps(lr, blockRect(bl)));
      if (block !== -1) {
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
      // Into the death freeze — the shield comes when play resumes.
      transition(state, "respawning");
      state.respawnTimer = CANNON.respawn;
      events.push({ type: "cannonHit", livesLeft: state.lives });
      return events;
    }
  }

  return events;
}
