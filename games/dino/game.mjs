// ============================================================================
// game.mjs — the Chrome Dino, DECLARED on the engine. Space/↑ (or a tap)
// jumps, ↓ ducks; the first jump starts the run, exactly like the
// original standing frozen in the error page. No special hook at all:
// held keys and the pointer feed input(), and the core does the rest.
// ============================================================================

import * as Dino from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls, DOWN } from "../../shared/touch.mjs";
import { trackHeldKeys } from "../../shared/input.mjs";

const held = trackHeldKeys("Space", "ArrowUp", "KeyW", "ArrowDown", "KeyS");

// A held pointer is a held jump (tap the desert to hop). The releases
// listen on the window: a press that starts on the canvas can end
// anywhere, and a release off-canvas must still land, or the dino jumps
// forever (Copter learned this first).
let pressing = false;
const canvas = document.getElementById("game");
canvas.addEventListener("pointerdown", () => (pressing = true));
window.addEventListener("pointerup", () => (pressing = false));
window.addEventListener("pointercancel", () => (pressing = false));

createGame({
  core: Dino,
  render,
  options: () => ({}),
  settings: { storageKey: "dinoSettings" }, // #sound binds by convention
  keys: { pause: "KeyP" }, // Space jumps

  input: () => ({
    jump: pressing || held.has("Space") || held.has("ArrowUp") || held.has("KeyW"),
    duck: held.has("ArrowDown") || held.has("KeyS"),
  }),

  sounds: {
    jumped: () => beep({ freq: 380, slideTo: 620, duration: 0.07, volume: 0.08 }),
    // THE beep — every hundredth point, in pairs, like the original.
    milestone: () => {
      beep({ freq: 988, duration: 0.06, volume: 0.09 });
      beep({ freq: 988, duration: 0.06, at: 0.09, volume: 0.09 });
    },
    died: () => beep({ freq: 220, slideTo: 55, duration: 0.5, type: "sawtooth" }),
  },

  best: "dinoBest",
  hud: (state) => ({ score: state.score }),
});

// Thumbs: the canvas is the jump button; ducking gets a real key.
touchControls([DOWN]); // the canvas is the jump button; ducking gets a thumb
