// Tuning values. The classic layout: three silos with six cities sheltered
// between them, everything on one ground line, death arriving from y = 0.

export const SKY = { width: 640, height: 480 };

export const DT = 1 / 120;

export const GROUND = 440; // the ground line — everything lives here

export const CITIES = {
  // Three cities in each valley between the silos.
  xs: [150, 205, 260, 380, 435, 490],
  width: 36,
  height: 14,
};

export const SILOS = {
  xs: [80, 320, 560], // left flank, center, right flank
  ammo: 10, // rounds per silo per wave
};

export const INTERCEPTOR = {
  speed: 300, // fast — but the blast still needs LEADING the target
  minY: 30, // can't detonate above the sky...
  maxY: GROUND - 20, // ...or in the dirt
};

export const BLAST = {
  radius: 34,
  life: 1.2, // seconds; radius follows a sine over this span (blastRadius)
};

export const WAVES = {
  firstCount: 8, // ICBMs in wave 1
  addPerWave: 2,
  rate: 0.8, // average enemy launches per second while the pool lasts
  speed: 42, // ICBM fall speed on wave 1...
  speedPerWave: 7, // ...climbing per wave...
  maxSpeed: 130, // ...to a ceiling
};

export const SCORE = {
  kill: 25, // per ICBM caught in a fireball
  ammoBonus: 5, // per unspent round at wave end
  cityBonus: 100, // per surviving city at wave end
};

export const DEBRIEF = 300; // ticks (~2.5s) of between-wave breathing room
