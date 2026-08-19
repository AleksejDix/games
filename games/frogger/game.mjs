// ============================================================================
// game.mjs — Frogger, DECLARED on the clocked engine. Hops are Snake-
// style taps through the special hook; the lanes flow on the clock.
// ============================================================================

import * as Frog from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare, deathWhine } from "../../shared/audio.mjs";
import { touchControls, DPAD } from "../../shared/touch.mjs";
import { actionKeys } from "../../shared/input.mjs";

const KEY_DIRS = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

createGame({
  core: Frog,
  render,
  options: () => ({}),

  // The hop table, wired by actionKeys — hop() guards status itself.
  special: actionKeys(
    Object.fromEntries(
      Object.entries(KEY_DIRS).map(([code, dir]) => [code, (s) => Frog.hop(s, dir)])
    )
  ),

  sounds: {
    hopped: () => beep({ freq: 480, slideTo: 640, duration: 0.05, volume: 0.06 }),
    croaked: () => beep({ freq: 200, slideTo: 60, duration: 0.35, type: "sawtooth", volume: 0.12 }),
    home: () => {
      beep({ freq: 660, duration: 0.07 });
      beep({ freq: 990, duration: 0.1, at: 0.08 });
    },
    cleared: () => fanfare(),
    died: () => deathWhine(),
  },

  best: true,
  hud: (state) => ({ score: state.score, lives: "♥".repeat(state.lives) }),
});

touchControls(DPAD);
