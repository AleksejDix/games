// ============================================================================
// game.mjs — Snake, DECLARED on the engine.
// The wiring program lives in shared/engine.mjs; this file only says what
// Snake is: its world options, its tap-queue keys, its bleeps.
// ============================================================================

import * as Snake from "./logic.mjs";
import { render, CELL } from "./render.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { touchControls, DPAD } from "../../shared/touch.mjs";
import { actionKeys } from "../../shared/input.mjs";

const canvas = document.getElementById("game");
const COLS = courtSize(canvas).width / CELL; // 21 — court units, not the hi-dpi backing
const ROWS = courtSize(canvas).height / CELL; // 21


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
    controls: { wrap: true, stepMs: 130 },
  },

  // The steer table, wired by actionKeys. No status check needed:
  // queueDirection is safe in every status (ready starts the crawl —
  // the core's rule; a dead state just holds a wish the restart throws
  // away with the rest of it).
  special: actionKeys(
    Object.fromEntries(
      Object.entries(KEY_DIRS).map(([code, name]) => [
        code,
        (state) => Snake.queueDirection(state, Snake.DIRS[name]),
      ])
    )
  ),

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
    cleared: () => fanfare(),
  },

  best: true,
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls(DPAD);
