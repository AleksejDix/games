// ============================================================================
// game.mjs — Lunar Lander, DECLARED on the engine.
//
// The engine's validation piece: the first game BORN on createGame().
// This whole file is the declaration — if the framework is right, a new
// game costs a core, a renderer, and this.
// ============================================================================

import * as Lander from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { trackHeldKeys, axis } from "../../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowLeft", "ArrowRight", "ArrowUp", "KeyA", "KeyD", "KeyW");

const fuelEl = document.getElementById("fuel");

createGame({
  core: Lander,
  render,

  options: (s) => ({ fuel: s.fuel }),

  settings: {
    storageKey: "landerSettings",
    defaults: { fuel: 400 },
    read: () => ({ fuel: Number(fuelEl.value) }),
    write: (s) => {
      fuelEl.value = String(s.fuel);
    },
    worldEls: [fuelEl],
  },

  input: () => ({
    turn: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
    thrust: held.has("ArrowUp") || held.has("KeyW") ? 1 : 0,
  }),
  runningStatuses: ["ready", "playing"], // ready must tick to feel the first touch

  sounds: {
    landed: () => fanfare(),
    crashed: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
  },

  best: "landerBest",
  hud: (state) => ({ score: state.score }),
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls([
  { code: "ArrowLeft", label: "◀" },
  { code: "ArrowRight", label: "▶" },
  { code: "ArrowUp", label: "▲" }, // burn
  { code: "Enter", label: "↻" },
]);
