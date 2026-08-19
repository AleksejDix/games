// ============================================================================
// game.mjs — Tetris, DECLARED on the engine.
//
// Gravity rides the engine clock through stepMs (Snake's shrinking-tick
// trick); the steering is all ACTIONS through the special-keys hook, so
// the OS key-repeat drives movement for free. Space hard-drops, as the
// gods of stacking intended — pause lives on P.
// ============================================================================

import * as Tetris from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";

const levelEl = document.getElementById("startLevel");

createGame({
  core: Tetris,
  render,

  options: (s) => ({ startLevel: s.startLevel }),
  stepMs: (state) => state.stepMs, // gravity hurries as the levels climb

  settings: {
    storageKey: "tetrisSettings",
    defaults: { startLevel: 1 },
    read: () => ({ startLevel: Number(levelEl.value) }),
    write: (s) => {
      levelEl.value = String(s.startLevel);
    },
    worldEls: [levelEl],
  },

  keys: { pause: "KeyP" }, // Space is sacred: it hard-drops

  special: (e, api) => {
    if (api.paused || api.state.status !== "playing") return false;
    const state = api.state;
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        e.preventDefault();
        api.dispatch(Tetris.move(state, -1));
        return true;
      case "ArrowRight":
      case "KeyD":
        e.preventDefault();
        api.dispatch(Tetris.move(state, 1));
        return true;
      case "ArrowDown":
      case "KeyS":
        e.preventDefault();
        api.dispatch(Tetris.softDrop(state));
        return true;
      case "ArrowUp":
      case "KeyW":
      case "KeyX":
        e.preventDefault();
        if (!e.repeat) api.dispatch(Tetris.rotate(state)); // no spin-holding
        return true;
      case "Space":
        e.preventDefault();
        if (!e.repeat) api.dispatch(Tetris.hardDrop(state));
        return true;
    }
    return false;
  },

  sounds: {
    rotated: () => beep({ freq: 520, duration: 0.04, volume: 0.07 }),
    locked: () => beep({ freq: 130, duration: 0.06, volume: 0.1 }),
    hardDrop: () => beep({ freq: 320, slideTo: 90, duration: 0.1, volume: 0.1 }),
    // One note per line — four notes is the word "TETRIS" in beep.
    cleared: (e) => fanfare(e.rows),
    levelUp: () => {
      beep({ freq: 392, duration: 0.1, type: "triangle" });
      beep({ freq: 587, duration: 0.14, at: 0.11, type: "triangle" });
    },
    died: () => beep({ freq: 180, slideTo: 35, duration: 0.9, type: "sawtooth" }),
  },

  best: "tetrisBest",
  hud: (state) => ({ score: state.score }),
});

// Thumb layout for phones — buttons that synthesize these keys.
touchControls([
  { code: "ArrowLeft", label: "◀" },
  { code: "ArrowRight", label: "▶" },
  { code: "ArrowUp", label: "⟳" }, // rotate
  { code: "ArrowDown", label: "▼" }, // soft drop
  { code: "Space", label: "⤓" }, // hard drop
  { code: "Enter", label: "↻" },
]);
