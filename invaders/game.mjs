// ============================================================================
// game.mjs — Space Invaders, DECLARED on the engine.
// The death freeze rides the runningStatuses hook: the loop simulates
// through "respawning" — that's how the freeze ends.
// ============================================================================

import * as Invaders from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../shared/engine.mjs";
import { beep } from "../shared/audio.mjs";
import { axis } from "../shared/input.mjs";

// Intensity names are shell vocabulary for the core's bombRate.
const INTENSITY = { calm: 0.35, classic: 0.6, chaos: 1.1 };

const livesSelectEl = document.getElementById("startLives");
const intensityEl = document.getElementById("intensity");
const soundEl = document.getElementById("sound");

// The famous four-step bassline — the march event carries its note, so
// the music follows the fleet's actual tempo, accelerating as it thins.
const MARCH_NOTES = [110, 98, 87, 78];

createGame({
  core: Invaders,
  render,

  options: (s) => ({
    lives: s.lives,
    bombRate: INTENSITY[s.intensity] ?? INTENSITY.classic,
  }),

  settings: {
    storageKey: "invadersSettings",
    defaults: { lives: 3, intensity: "classic", sound: true },
    read: () => ({
      lives: Number(livesSelectEl.value),
      intensity: intensityEl.value,
      sound: soundEl.checked,
    }),
    write: (s) => {
      livesSelectEl.value = String(s.lives);
      intensityEl.value = s.intensity;
      soundEl.checked = s.sound;
    },
    worldEls: [livesSelectEl, intensityEl],
    presentationEls: [soundEl],
  },

  heldKeys: ["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space"],
  input: (held) => ({
    move: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
    fire: held.has("Space"),
  }),
  keys: { pause: "KeyP" }, // Space fires
  runningStatuses: ["playing", "respawning"], // the freeze must tick to end

  sounds: {
    march: (e) => beep({ freq: MARCH_NOTES[e.note], duration: 0.07, volume: 0.1 }),
    fired: () => beep({ freq: 990, slideTo: 440, duration: 0.06, volume: 0.07 }),
    invaderHit: () => beep({ freq: 180, slideTo: 60, duration: 0.12 }),
    bunkerHit: () => beep({ freq: 140, duration: 0.04, volume: 0.06 }),
    bombShot: () => beep({ freq: 660, slideTo: 880, duration: 0.05, volume: 0.08 }),
    ufo: () => {
      beep({ freq: 440, duration: 0.08, type: "triangle", volume: 0.08 });
      beep({ freq: 560, duration: 0.08, at: 0.09, type: "triangle", volume: 0.08 });
      beep({ freq: 440, duration: 0.08, at: 0.18, type: "triangle", volume: 0.08 });
    },
    ufoHit: (e) =>
      [660, 880, e.points === 300 ? 1320 : 990].forEach((freq, i) =>
        beep({ freq, duration: 0.1, at: i * 0.09, type: "triangle" })
      ),
    extraLife: () =>
      [523, 659, 784, 1047].forEach((freq, i) =>
        beep({ freq, duration: 0.12, at: i * 0.08, type: "triangle" })
      ),
    cannonHit: () => beep({ freq: 220, slideTo: 55, duration: 0.4, type: "sawtooth" }),
    wave: () => {
      beep({ freq: 523, duration: 0.09, type: "triangle" });
      beep({ freq: 784, duration: 0.12, at: 0.1, type: "triangle" });
    },
    died: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
  },

  best: { key: "invadersBest", on: ["died"] },
  hud: (state) => ({ score: state.score, lives: "▲".repeat(state.lives) }),
});
