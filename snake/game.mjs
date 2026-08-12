// ============================================================================
// game.mjs — the IMPERATIVE SHELL
//
// Everything browser-specific lives here: canvas drawing, keyboard events,
// localStorage. It contains NO game rules — those are imported from
// logic.mjs, where `node --test` can reach them.
//
// After the shared/ refactor this file keeps only what is SNAKE'S: its
// world parameters, its tap-queue input, its pixels, its bleeps. The
// mechanisms every game repeats (the loop, settings persistence, the
// overlay, audio unlock) come from shared/ modules.
// ============================================================================

import * as Snake from "./logic.mjs";
import { render, CELL } from "./render.mjs";
import { beep, unlockOnFirstGesture, soundBoard } from "../shared/audio.mjs";
import { bindSettings } from "../shared/settings.mjs";
import { startLoop } from "../shared/loop.mjs";
import { trackBest } from "../shared/score.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = canvas.width / CELL;       // 21
const ROWS = canvas.height / CELL;      // 21

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

let state;
let paused = false; // pausing is presentation, not a game rule → lives here

// ----------------------------------------------------------------------------
// SETTINGS — the mechanism is shared; the key, defaults, and controls are
// ours. World controls restart the game; sound is presentation and doesn't.
// ----------------------------------------------------------------------------

const wrapEl = document.getElementById("wrap");
const speedEl = document.getElementById("speed");
const soundEl = document.getElementById("sound");

const settings = bindSettings({
  storageKey: "snakeSettings",
  defaults: { wrap: true, stepMs: 130, sound: true },
  read: () => ({
    wrap: wrapEl.checked,
    stepMs: Number(speedEl.value),
    sound: soundEl.checked,
  }),
  write: (s) => {
    wrapEl.checked = s.wrap;
    speedEl.value = String(s.stepMs);
    soundEl.checked = s.sound;
  },
  worldEls: [wrapEl, speedEl],
  presentationEls: [soundEl],
  onWorldChange: () => newGame(),
});

function newGame() {
  state = Snake.createState({
    cols: COLS,
    rows: ROWS,
    wrap: settings.wrap,
    stepMs: settings.stepMs,
  });
  paused = false;
}

// ----------------------------------------------------------------------------
// INPUT — Snake keeps its own tap-queue handling: discrete taps, not held
// keys, is the right model for grid movement (see shared/input.mjs).
// ----------------------------------------------------------------------------

unlockOnFirstGesture();

const KEY_DIRS = {
  ArrowUp: "up",    KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (state.status === "playing") paused = !paused;
    return;
  }
  if (e.code === "Enter" && (state.status === "gameover" || state.status === "cleared")) {
    newGame();
    return;
  }

  const name = KEY_DIRS[e.code];
  if (name && state.status === "playing" && !paused) {
    e.preventDefault();
    Snake.queueDirection(state, Snake.DIRS[name]);
  }
});

// ----------------------------------------------------------------------------
// SOUND — a lookup from step() events to bleeps. The core has no idea any
// of this exists; it just keeps reporting what happened.
// ----------------------------------------------------------------------------

const SOUNDS = {
  ate: () => beep({ freq: 880, duration: 0.06 }),
  ateBonus: () => {
    // A little two-note rising chirp — richer than one bleep, still cheap.
    beep({ freq: 660, duration: 0.06 });
    beep({ freq: 990, duration: 0.09, at: 0.07 });
  },
  // Quiet downward fizzle — only possible now that expiry is an EVENT.
  // Under the old single-string API this moment was unobservable.
  bonusExpired: () =>
    beep({ freq: 440, slideTo: 220, duration: 0.12, volume: 0.05, type: "triangle" }),
  died: () => beep({ freq: 220, slideTo: 55, duration: 0.45, type: "sawtooth" }),
  // The fanfare almost nobody will ever hear: a perfect, board-filling game.
  cleared: () =>
    [523, 659, 784, 1047].forEach((freq, i) =>
      beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
    ),
};

const sound = soundBoard(SOUNDS, () => settings.sound);

// ----------------------------------------------------------------------------
// WIRE IT UP — the shared loop, fed Snake's specifics as functions.
// stepMs is a function because eating makes it shrink mid-game.
// ----------------------------------------------------------------------------

const saveBest = trackBest("snakeBest", bestEl);

newGame();

startLoop({
  stepMs: () => state.stepMs,
  running: () => state.status === "playing" && !paused,
  update: () => {
    // step() hands back everything that happened this tick, as data.
    for (const event of Snake.step(state)) {
      if (event.type === "died" || event.type === "cleared") saveBest(state.score);
      sound(event);
    }
  },
  render: () => {
    render(ctx, state, paused);
    scoreEl.textContent = state.score; // the header readout rides along
  },
});
