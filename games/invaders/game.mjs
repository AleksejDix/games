// ============================================================================
// game.mjs — Space Invaders, DECLARED on the engine.
// The death freeze rides the runningStatuses hook: the loop simulates
// through "respawning" — that's how the freeze ends.
// ============================================================================

import * as Invaders from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare, deathWhine, waveJingle } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { holdZones } from "../../shared/gestures.mjs";
import { trackHeldKeys, axis } from "../../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space");

// Intensity names are shell vocabulary for the core's bombRate.
const INTENSITY = { calm: 0.35, classic: 0.6, chaos: 1.1 };


// The famous four-step bassline — the march event carries its note, so
// the music follows the fleet's actual tempo, accelerating as it thins.
const MARCH_NOTES = [110, 98, 87, 78];

createGame({
  core: Invaders,
  render,

  options: (s) => ({
    lives: s.startLives,
    bombRate: INTENSITY[s.intensity] ?? INTENSITY.classic,
  }),

  settings: {
    controls: { startLives: 3, intensity: "classic" },
  },

  input: () => ({
    move: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
    fire: held.has("Space"),
  }),
  keys: { pause: "KeyP" }, // Space fires
  runningStatuses: ["ready", "playing", "respawning"], // the freeze must tick to end

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
    extraLife: () => fanfare(),
    cannonHit: () => beep({ freq: 220, slideTo: 55, duration: 0.4, type: "sawtooth" }),
    wave: () => waveJingle(),
    died: () => deathWhine(),
  },

  best: true,
  hud: (state) => ({ score: state.score, lives: "▲".repeat(state.lives) }),
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls([]);
// Hold a bottom half to march the cannon; tap up in the sky to fire —
// two fingers do both at once (the zones are refcounted).
holdZones(document.getElementById("game"), {
  zones: [
    { when: (x, y) => y >= 0.55 && x < 0.5, code: "ArrowLeft" },
    { when: (x, y) => y >= 0.55, code: "ArrowRight" },
  ],
  tap: { code: "Space", when: (x, y) => y < 0.55 },
});
