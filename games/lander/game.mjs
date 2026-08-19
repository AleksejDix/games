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
import { touchControls, LR, UP } from "../../shared/touch.mjs";
import { trackHeldKeys, axis } from "../../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowLeft", "ArrowRight", "ArrowUp", "KeyA", "KeyD", "KeyW");


createGame({
  core: Lander,
  render,

  options: (s) => ({ fuel: s.fuel }),

  settings: {
    storageKey: "landerSettings",
    controls: { fuel: 400 },
  },

  input: () => ({
    turn: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
    thrust: held.has("ArrowUp") || held.has("KeyW") ? 1 : 0,
  }),

  sounds: {
    landed: () => fanfare(),
    crashed: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
  },

  best: "landerBest",
  hud: (state) => ({ score: state.score }),
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls([...LR, UP]); // ▲ burns
