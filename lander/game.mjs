// ============================================================================
// game.mjs — Lunar Lander, DECLARED on the engine.
//
// The engine's validation piece: the first game BORN on createGame().
// This whole file is the declaration — if the framework is right, a new
// game costs a core, a renderer, and this.
// ============================================================================

import * as Lander from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../shared/engine.mjs";
import { beep } from "../shared/audio.mjs";
import { trackHeldKeys, axis } from "../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowLeft", "ArrowRight", "ArrowUp", "KeyA", "KeyD", "KeyW");

const fuelEl = document.getElementById("fuel");
const soundEl = document.getElementById("sound");

createGame({
  core: Lander,
  render,

  options: (s) => ({ fuel: s.fuel }),

  settings: {
    storageKey: "landerSettings",
    defaults: { fuel: 400, sound: true },
    read: () => ({ fuel: Number(fuelEl.value), sound: soundEl.checked }),
    write: (s) => {
      fuelEl.value = String(s.fuel);
      soundEl.checked = s.sound;
    },
    worldEls: [fuelEl],
    presentationEls: [soundEl],
  },

  input: () => ({
    turn: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
    thrust: held.has("ArrowUp") || held.has("KeyW") ? 1 : 0,
  }),

  sounds: {
    landed: () =>
      [523, 659, 784, 1047].forEach((freq, i) =>
        beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
      ),
    crashed: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
  },

  best: { key: "landerBest", on: ["landed"] },
  hud: (state) => ({ score: state.score }),
});
