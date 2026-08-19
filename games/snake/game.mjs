// ============================================================================
// game.mjs — Snake, DECLARED on the engine.
// The wiring program lives in shared/engine.mjs; this file only says what
// Snake is: its world options, its tap-queue keys, its bleeps.
// ============================================================================

import * as Snake from "./logic.mjs";
import { render, CELL } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";

const canvas = document.getElementById("game");
const COLS = canvas.width / CELL; // 21
const ROWS = canvas.height / CELL; // 21

const wrapEl = document.getElementById("wrap");
const speedEl = document.getElementById("speed");
const soundEl = document.getElementById("sound");

// Discrete taps, not held keys: each press queues one turn in the core.
const KEY_DIRS = {
  ArrowUp: "up",    KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

createGame({
  core: Snake,
  render,

  options: (s) => ({ cols: COLS, rows: ROWS, wrap: s.wrap, stepMs: s.stepMs }),
  stepMs: (state) => state.stepMs, // eating shrinks it mid-game

  settings: {
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
  },

  special: (e, api) => {
    const name = KEY_DIRS[e.code];
    if (name && api.state.status === "playing" && !api.paused) {
      e.preventDefault();
      Snake.queueDirection(api.state, Snake.DIRS[name]);
      return true;
    }
    return false;
  },

  sounds: {
    ate: () => beep({ freq: 880, duration: 0.06 }),
    ateBonus: () => {
      beep({ freq: 660, duration: 0.06 });
      beep({ freq: 990, duration: 0.09, at: 0.07 });
    },
    // Only audible because expiry is an EVENT — see the events-as-data log.
    bonusExpired: () =>
      beep({ freq: 440, slideTo: 220, duration: 0.12, volume: 0.05, type: "triangle" }),
    died: () => beep({ freq: 220, slideTo: 55, duration: 0.45, type: "sawtooth" }),
    cleared: () =>
      [523, 659, 784, 1047].forEach((freq, i) =>
        beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
      ),
  },

  best: { key: "snakeBest", on: ["died", "cleared"] },
  hud: (state) => ({ score: state.score }),
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls([
  { code: "ArrowLeft", label: "◀" },
  { code: "ArrowUp", label: "▲" },
  { code: "ArrowDown", label: "▼" },
  { code: "ArrowRight", label: "▶" },
  { code: "Enter", label: "↻" },
]);
