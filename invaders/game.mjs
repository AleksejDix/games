// ============================================================================
// game.mjs — Space Invaders' WIRING: input, settings, sounds, the loop.
// Space fires, so pause is P (the Asteroids convention).
// ============================================================================

import * as Invaders from "./logic.mjs";
import { render } from "./render.mjs";
import { beep, unlockOnFirstGesture, soundBoard } from "../shared/audio.mjs";
import { bindSettings } from "../shared/settings.mjs";
import { startLoop } from "../shared/loop.mjs";
import { trackHeldKeys, axis } from "../shared/input.mjs";
import { trackBest } from "../shared/score.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const livesEl = document.getElementById("lives");

let state;
let paused = false;

// ----------------------------------------------------------------------------
// SETTINGS — intensity names are shell vocabulary for the core's bombRate.
// ----------------------------------------------------------------------------

const INTENSITY = { calm: 0.35, classic: 0.6, chaos: 1.1 };

const livesSelectEl = document.getElementById("startLives");
const intensityEl = document.getElementById("intensity");
const soundEl = document.getElementById("sound");

const settings = bindSettings({
  storageKey: "invadersSettings",
  defaults: { lives: 3, intensity: "classic", sound: true },
  read: () => ({
    lives: Number(livesSelectEl.value),
    intensity: intensityEl.value,
    sound: soundEl.checked,
  }),
  write: (s) => {
    livesSelectEl.value = String(s.lives);
    intensityEl.value = s.intensity;
    soundEl.checked = s.sound;
  },
  worldEls: [livesSelectEl, intensityEl],
  presentationEls: [soundEl],
  onWorldChange: () => newGame(),
});

function newGame() {
  state = Invaders.createState({
    lives: settings.lives,
    bombRate: INTENSITY[settings.intensity] ?? INTENSITY.classic,
  });
  paused = false;
}

// ----------------------------------------------------------------------------
// INPUT
// ----------------------------------------------------------------------------

unlockOnFirstGesture();

const held = trackHeldKeys("ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space");

const playerInput = () => ({
  move: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
  fire: held.has("Space"),
});

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" && state.status === "playing") paused = !paused;
  if (e.code === "Enter" && state.status === "gameover") newGame();
});

// ----------------------------------------------------------------------------
// SOUND — the march event carries its note, so the famous four-step
// bassline follows the fleet's actual tempo, accelerating as it thins.
// ----------------------------------------------------------------------------

const MARCH_NOTES = [110, 98, 87, 78];

const SOUNDS = {
  march: (e) => beep({ freq: MARCH_NOTES[e.note], duration: 0.07, volume: 0.1 }),
  fired: () => beep({ freq: 990, slideTo: 440, duration: 0.06, volume: 0.07 }),
  invaderHit: () => beep({ freq: 180, slideTo: 60, duration: 0.12 }),
  bunkerHit: () => beep({ freq: 140, duration: 0.04, volume: 0.06 }),
  bombShot: () => beep({ freq: 660, slideTo: 880, duration: 0.05, volume: 0.08 }),
  // The saucer announces itself with a little warble...
  ufo: () => {
    beep({ freq: 440, duration: 0.08, type: "triangle", volume: 0.08 });
    beep({ freq: 560, duration: 0.08, at: 0.09, type: "triangle", volume: 0.08 });
    beep({ freq: 440, duration: 0.08, at: 0.18, type: "triangle", volume: 0.08 });
  },
  // ...and pays out with one — pitch scaled by the prize.
  ufoHit: (e) =>
    [660, 880, e.points === 300 ? 1320 : 990].forEach((freq, i) =>
      beep({ freq, duration: 0.1, at: i * 0.09, type: "triangle" })
    ),
  extraLife: () =>
    [523, 659, 784, 1047].forEach((freq, i) =>
      beep({ freq, duration: 0.12, at: i * 0.08, type: "triangle" })
    ),
  cannonHit: () => beep({ freq: 220, slideTo: 55, duration: 0.4, type: "sawtooth" }),
  wave: () => {
    beep({ freq: 523, duration: 0.09, type: "triangle" });
    beep({ freq: 784, duration: 0.12, at: 0.1, type: "triangle" });
  },
  died: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
};

const sound = soundBoard(SOUNDS, () => settings.sound);

// ----------------------------------------------------------------------------
// WIRE IT UP
// ----------------------------------------------------------------------------

const STEP_MS = Invaders.DT * 1000;

const saveBest = trackBest("invadersBest", bestEl);

newGame();

startLoop({
  stepMs: () => STEP_MS,
  // The loop also runs through the death freeze — that's how it ends.
  running: () =>
    (state.status === "playing" || state.status === "respawning") && !paused,
  update: () => {
    for (const event of Invaders.step(state, playerInput())) {
      if (event.type === "died") saveBest(state.score);
      sound(event);
    }
  },
  render: () => {
    render(ctx, state, paused);
    scoreEl.textContent = state.score;
    livesEl.textContent = "▲".repeat(state.lives);
  },
});
