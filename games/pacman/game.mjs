// ============================================================================
// game.mjs — Pac-Maze, DECLARED on the clocked engine. Steering is Snake-
// style taps through the special hook (a wish the core applies at the next
// legal cell); the maze runs on the 60Hz clock. Space is eaten by nothing
// here, so pause moves to P.
// ============================================================================

import * as Pac from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { touchControls, DPAD } from "../../shared/touch.mjs";
import { actionKeys } from "../../shared/input.mjs";

const KEY_DIRS = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

createGame({
  core: Pac,
  render,
  options: () => ({}),
  keys: { pause: "KeyP" },
  // stepMs stays the default: the engine reads core.DT — 1000/60 per tick.

  // caught must keep simulating: it is the death-freeze COUNTDOWN, not a
  // stop — the world resumes by itself when the timer runs out.
  runningStatuses: ["ready", "playing", "caught"],

  // The steer table, wired by actionKeys. queueTurn wakes a ready world
  // itself and returns the started event for the dispatch funnel.
  special: actionKeys(
    Object.fromEntries(
      Object.entries(KEY_DIRS).map(([code, dir]) => [code, (s) => Pac.queueTurn(s, dir)])
    )
  ),

  sounds: {
    // The waka: two pitches alternating on pellet parity — the event's
    // `left` count IS the parity, so the shell keeps no counter.
    ate: (e) => beep({ freq: e.left % 2 ? 430 : 560, duration: 0.045, volume: 0.06 }),
    power: () => beep({ freq: 240, slideTo: 720, duration: 0.3, type: "triangle" }),
    // The ladder climbs 200→1600; the pitch climbs with it.
    ghostEaten: (e) =>
      beep({ freq: 300 + e.value / 4, slideTo: 900 + e.value / 2, duration: 0.18, type: "triangle" }),
    caught: () => beep({ freq: 520, slideTo: 110, duration: 0.5, type: "sawtooth" }),
    died: () => beep({ freq: 520, slideTo: 55, duration: 0.9, type: "sawtooth" }),
    cleared: () => fanfare(),
  },

  best: true,
  hud: (state) => ({ score: state.score, lives: "●".repeat(state.lives) }),
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls(DPAD);
