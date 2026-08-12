// ============================================================================
// game.mjs — Asteroids' WIRING: input, settings, sounds, the loop.
//
// One control-scheme note: Space FIRES here (as the arcade gods intended),
// so pause moves to P. Input is richer than the paddle games' one axis —
// playerInput() builds the { turn, thrust, fire } object every tick from
// the held keys.
// ============================================================================

import * as Asteroids from "./logic.mjs";
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
// SETTINGS
// ----------------------------------------------------------------------------

const livesSelectEl = document.getElementById("startLives");
const fieldEl = document.getElementById("field");
const soundEl = document.getElementById("sound");

const settings = bindSettings({
  storageKey: "asteroidsSettings",
  defaults: { lives: 3, field: 4, sound: true },
  read: () => ({
    lives: Number(livesSelectEl.value),
    field: Number(fieldEl.value),
    sound: soundEl.checked,
  }),
  write: (s) => {
    livesSelectEl.value = String(s.lives);
    fieldEl.value = String(s.field);
    soundEl.checked = s.sound;
  },
  worldEls: [livesSelectEl, fieldEl],
  presentationEls: [soundEl],
  onWorldChange: () => newGame(),
});

function newGame() {
  state = Asteroids.createState({
    lives: settings.lives,
    startAsteroids: settings.field,
  });
  paused = false;
}

// ----------------------------------------------------------------------------
// INPUT
// ----------------------------------------------------------------------------

unlockOnFirstGesture();

const held = trackHeldKeys(
  "ArrowLeft", "ArrowRight", "ArrowUp",
  "KeyA", "KeyD", "KeyW",
  "Space"
);

const playerInput = () => ({
  turn: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
  thrust: held.has("ArrowUp") || held.has("KeyW") ? 1 : 0,
  fire: held.has("Space"),
});

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" && state.status === "playing") paused = !paused;
  if (e.code === "Enter" && state.status === "gameover") newGame();
});

// ----------------------------------------------------------------------------
// SOUND
// ----------------------------------------------------------------------------

const SOUNDS = {
  fired: () => beep({ freq: 880, slideTo: 330, duration: 0.07, volume: 0.07 }),
  // Bigger rock, deeper boom — the size arrives on the event.
  asteroidHit: (e) =>
    beep({ freq: 320 / e.size, slideTo: 40, duration: 0.25, type: "sawtooth", volume: 0.15 }),
  wave: () => {
    beep({ freq: 523, duration: 0.09, type: "triangle" });
    beep({ freq: 784, duration: 0.12, at: 0.1, type: "triangle" });
  },
  shipHit: () => beep({ freq: 220, slideTo: 55, duration: 0.4, type: "sawtooth" }),
  died: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
};

const sound = soundBoard(SOUNDS, () => settings.sound);

// ----------------------------------------------------------------------------
// WIRE IT UP
// ----------------------------------------------------------------------------

const STEP_MS = Asteroids.DT * 1000;

const saveBest = trackBest("asteroidsBest", bestEl);

newGame();

startLoop({
  stepMs: () => STEP_MS,
  running: () => state.status === "playing" && !paused,
  update: () => {
    for (const event of Asteroids.step(state, playerInput())) {
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
