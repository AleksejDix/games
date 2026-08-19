// The shape of the world: cities to lose, silos to spend, a sky to watch.

import { SKY, CITIES, SILOS, WAVES } from "./constants.mjs";

export function createState({ random = Math.random, ammo = SILOS.ammo, started = false } = {}) {
  return {
    width: SKY.width,
    height: SKY.height,
    random,
    ammoPerSilo: ammo, // a setting → plain state; silos refill to this
    cities: CITIES.xs.map((x) => ({ x, alive: true })),
    silos: SILOS.xs.map((x) => ({ x, ammo, alive: true })),
    missiles: [], // ICBMs: { sx, sy, x, y, vx, vy, kind, index } — sx/sy anchor the trail
    interceptors: [], // ours: { sx, sy, x, y, tx, ty, vx, vy }
    blasts: [], // fireballs: { x, y, age }
    pool: WAVES.firstCount, // ICBMs yet to launch this wave
    aim: { x: SKY.width / 2, y: SKY.height / 2 }, // the crosshair
    wave: 1,
    debriefTimer: 0,
    lastBonus: 0, // shown on the debrief card
    score: 0,
    status: started ? "playing" : "ready",
    tick: 0, // world time: +1 per simulated step (replays anchor to it)
  };
}
