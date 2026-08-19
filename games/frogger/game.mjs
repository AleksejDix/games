// ============================================================================
// game.mjs — Frogger, DECLARED on the clocked engine. Hops are Snake-
// style taps through the special hook; the lanes flow on the clock.
// ============================================================================

import * as Frog from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";

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
  settings: { storageKey: "froggerSettings" }, // #sound binds by convention

  special: (e, api) => {
    const dir = KEY_DIRS[e.code];
    if (!dir) return false;
    e.preventDefault(); // a hop key never scrolls the page, even between games
    if (api.state.status === "playing") api.dispatch(Frog.hop(api.state, dir));
    return true; // (the engine already withholds special while paused)
  },

  sounds: {
    hopped: () => beep({ freq: 480, slideTo: 640, duration: 0.05, volume: 0.06 }),
    croaked: () => beep({ freq: 200, slideTo: 60, duration: 0.35, type: "sawtooth", volume: 0.12 }),
    home: () => {
      beep({ freq: 660, duration: 0.07 });
      beep({ freq: 990, duration: 0.1, at: 0.08 });
    },
    cleared: () => fanfare(),
    died: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
  },

  best: { key: "froggerBest", on: ["died"] },
  hud: (state) => ({ score: state.score, lives: "♥".repeat(state.lives) }),
});

touchControls([
  { code: "ArrowLeft", label: "◀" },
  { code: "ArrowUp", label: "▲" },
  { code: "ArrowDown", label: "▼" },
  { code: "ArrowRight", label: "▶" },
  { code: "Enter", label: "↻" },
]);
