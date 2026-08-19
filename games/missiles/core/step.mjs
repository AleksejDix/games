// One tick of the defense, plus launch() — the pointer ACTION.
//
// The core mechanic is indirection: interceptors don't hit missiles,
// they detonate into fireballs, and fireballs do the killing. The skill
// is LEADING — clicking where an ICBM will be when the blast peaks.

import {
  DT, GROUND, INTERCEPTOR, BLAST, WAVES, SCORE, SILOS, DEBRIEF,
} from "./constants.mjs";
import { transition } from "./machine.mjs";
import { clamp } from "../../../shared/math.mjs";
import { pick, chance } from "../../../shared/random.mjs";

// A fireball's radius over its life: a sine — born silent, peaks in the
// middle, gone without a cliff. One formula for physics AND rendering.
export function blastRadius(age) {
  return BLAST.radius * Math.sin((Math.PI * age) / BLAST.life);
}

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

const waveSize = (wave) => WAVES.firstCount + (wave - 1) * WAVES.addPerWave;
const waveSpeed = (wave) =>
  Math.min(WAVES.maxSpeed, WAVES.speed + (wave - 1) * WAVES.speedPerWave);

// The pointer's action: detonate a round at (x, y). The nearest silo with
// ammo answers — the classic feel of the left flank running dry while the
// center holds. Returns events like every other action.
export function launch(state, x, y) {
  if (state.status !== "playing") return [];

  const armed = state.silos.filter((s) => s.alive && s.ammo > 0);
  if (armed.length === 0) return [{ type: "empty" }]; // the hollow click

  const silo = armed.reduce((best, s) =>
    Math.abs(s.x - x) < Math.abs(best.x - x) ? s : best
  );
  silo.ammo -= 1;

  const tx = clamp(x, 0, state.width);
  const ty = clamp(y, INTERCEPTOR.minY, INTERCEPTOR.maxY);
  const sx = silo.x;
  const sy = GROUND - 10;
  const d = dist(sx, sy, tx, ty) || 1;
  state.interceptors.push({
    sx, sy, // trail anchor
    x: sx,
    y: sy,
    tx, ty,
    vx: ((tx - sx) / d) * INTERCEPTOR.speed,
    vy: ((ty - sy) / d) * INTERCEPTOR.speed,
  });
  return [{ type: "fired" }];
}

export function step(state, input = {}) {
  // The debrief: the world holds its breath between waves.
  if (state.status === "debrief") {
    state.debriefTimer -= 1;
    if (state.debriefTimer <= 0) {
      transition(state, "playing");
      state.wave += 1;
      state.pool = waveSize(state.wave);
      // Silos are rebuilt and rearmed every wave. Cities are not — that
      // asymmetry IS the game.
      for (const s of state.silos) {
        s.alive = true;
        s.ammo = state.ammoPerSilo;
      }
      return [{ type: "wave", number: state.wave }];
    }
    return [];
  }

  if (state.status !== "playing") return [];

  const events = [];

  // The crosshair rides the input — pure position, no buttons; firing
  // arrives separately as the launch() action.
  if (input.aim) {
    state.aim = {
      x: clamp(input.aim.x, 0, state.width),
      y: clamp(input.aim.y, 0, state.height),
    };
  }

  // The rain: launches spread over the wave, aimed only at what stands.
  if (state.pool > 0 && chance(state.random, WAVES.rate, DT)) {
    const targets = [];
    state.cities.forEach((c, index) => {
      if (c.alive) targets.push({ kind: "city", x: c.x, index });
    });
    state.silos.forEach((s, index) => {
      if (s.alive) targets.push({ kind: "silo", x: s.x, index });
    });
    if (targets.length > 0) {
      state.pool -= 1;
      const sx = state.random() * state.width;
      const target = pick(targets, state.random);
      const d = dist(sx, 0, target.x, GROUND) || 1;
      const speed = waveSpeed(state.wave);
      state.missiles.push({
        sx, sy: 0, // trail anchor
        x: sx,
        y: 0,
        vx: ((target.x - sx) / d) * speed,
        vy: (GROUND / d) * speed,
        kind: target.kind,
        index: target.index,
      });
    }
  }

  // Fireballs age out on their sine.
  for (const b of state.blasts) b.age += DT;
  state.blasts = state.blasts.filter((b) => b.age < BLAST.life);

  // Interceptors fly, and detonate on arrival.
  for (let i = state.interceptors.length - 1; i >= 0; i--) {
    const r = state.interceptors[i];
    r.x += r.vx * DT;
    r.y += r.vy * DT;
    if (dist(r.x, r.y, r.tx, r.ty) <= INTERCEPTOR.speed * DT) {
      state.blasts.push({ x: r.tx, y: r.ty, age: 0 });
      state.interceptors.splice(i, 1);
      events.push({ type: "boom" });
    }
  }

  // ICBMs fall — through fireballs if they dare.
  for (let i = state.missiles.length - 1; i >= 0; i--) {
    const m = state.missiles[i];
    m.x += m.vx * DT;
    m.y += m.vy * DT;

    const caught = state.blasts.some(
      (b) => dist(m.x, m.y, b.x, b.y) <= blastRadius(b.age)
    );
    if (caught) {
      state.missiles.splice(i, 1);
      state.score += SCORE.kill;
      events.push({ type: "kill", points: SCORE.kill });
      continue;
    }

    if (m.y >= GROUND) {
      state.missiles.splice(i, 1);
      const target = m.kind === "city" ? state.cities[m.index] : state.silos[m.index];
      if (target.alive) {
        target.alive = false;
        events.push({ type: "impact", target: m.kind });
      } else {
        events.push({ type: "impact", target: "ground" });
      }
    }
  }

  // Wave end: the pool is spent and the sky is clear.
  if (
    state.pool === 0 &&
    state.missiles.length === 0 &&
    state.interceptors.length === 0
  ) {
    const ammoLeft = state.silos.reduce((sum, s) => sum + (s.alive ? s.ammo : 0), 0);
    const citiesLeft = state.cities.filter((c) => c.alive).length;
    const bonus = ammoLeft * SCORE.ammoBonus + citiesLeft * SCORE.cityBonus;
    state.score += bonus;
    state.lastBonus = bonus;
    events.push({ type: "waveEnd", bonus, cities: citiesLeft });

    if (citiesLeft === 0) {
      transition(state, "gameover");
      events.push({ type: "died" });
    } else {
      transition(state, "debrief");
      state.debriefTimer = DEBRIEF;
    }
  }

  return events;
}
