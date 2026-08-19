// ============================================================================
// game.mjs — Asteroids, DECLARED on the engine.
// Space fires, so pause moves to P via the keys config.
// ============================================================================

import * as Asteroids from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { trackHeldKeys, axis } from "../../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys(
  "ArrowLeft", "ArrowRight", "ArrowUp",
  "KeyA", "KeyD", "KeyW",
  "Space"
);

const livesSelectEl = document.getElementById("startLives");
const fieldEl = document.getElementById("field");

createGame({
  core: Asteroids,
  render,

  options: (s) => ({ lives: s.lives, startAsteroids: s.field }),

  settings: {
    storageKey: "asteroidsSettings",
    defaults: { lives: 3, field: 4 },
    read: () => ({
      lives: Number(livesSelectEl.value),
      field: Number(fieldEl.value),
    }),
    write: (s) => {
      livesSelectEl.value = String(s.lives);
      fieldEl.value = String(s.field);
    },
    worldEls: [livesSelectEl, fieldEl],
  },

  input: () => ({
    turn: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
    thrust: held.has("ArrowUp") || held.has("KeyW") ? 1 : 0,
    fire: held.has("Space"),
  }),
  keys: { pause: "KeyP" }, // Space fires, as the arcade gods intended

  sounds: {
    fired: () => beep({ freq: 880, slideTo: 330, duration: 0.07, volume: 0.07 }),
    // Bigger rock, deeper boom — the size arrives on the event.
    asteroidHit: (e) =>
      beep({ freq: 320 / e.size, slideTo: 40, duration: 0.25, type: "sawtooth", volume: 0.15 }),
    wave: () => {
      beep({ freq: 523, duration: 0.09, type: "triangle" });
      beep({ freq: 784, duration: 0.12, at: 0.1, type: "triangle" });
    },
    shipHit: () => beep({ freq: 220, slideTo: 55, duration: 0.4, type: "sawtooth" }),
    died: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
  },

  best: "asteroidsBest",
  hud: (state) => ({ score: state.score, lives: "▲".repeat(state.lives) }),
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls([
  { code: "ArrowLeft", label: "◀" },
  { code: "ArrowRight", label: "▶" },
  { code: "ArrowUp", label: "▲" }, // thrust
  { code: "Space", label: "●" }, // fire
  { code: "Enter", label: "↻" },
]);
