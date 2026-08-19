// ============================================================================
// game.mjs — Racer, DECLARED on the engine.
// Built by request of the studio's youngest test driver.
// ============================================================================

import * as Racer from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { trackHeldKeys, axis } from "../../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys(
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "KeyA", "KeyD", "KeyW", "KeyS"
);

const TRAFFIC_LEVELS = { light: 0.5, normal: 0.9, rush: 1.4 };

const trafficEl = document.getElementById("traffic");

createGame({
  core: Racer,
  render,

  options: (s) => ({ trafficRate: TRAFFIC_LEVELS[s.traffic] ?? TRAFFIC_LEVELS.normal }),

  settings: {
    storageKey: "racerSettings",
    defaults: { traffic: "normal" },
    read: () => ({ traffic: trafficEl.value }),
    write: (s) => {
      trafficEl.value = s.traffic;
    },
    worldEls: [trafficEl],
  },

  input: () => ({
    steer: axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
    gas: held.has("ArrowUp") || held.has("KeyW") ? 1 : 0,
    brake: held.has("ArrowDown") || held.has("KeyS") ? 1 : 0,
  }),
  runningStatuses: ["ready", "playing"], // ready must tick to feel the first touch

  sounds: {
    passed: () => beep({ freq: 660, slideTo: 880, duration: 0.06, volume: 0.08 }),
    crashed: () => beep({ freq: 140, slideTo: 45, duration: 0.35, type: "sawtooth" }),
    checkpoint: () => {
      beep({ freq: 523, duration: 0.09, type: "triangle" });
      beep({ freq: 784, duration: 0.12, at: 0.1, type: "triangle" });
    },
    died: () => beep({ freq: 180, slideTo: 40, duration: 0.7, type: "sawtooth" }),
  },

  best: "racerBest",
  hud: (state) => ({ score: state.score }),
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls([
  { code: "ArrowLeft", label: "◀" },
  { code: "ArrowRight", label: "▶" },
  { code: "ArrowUp", label: "▲" }, // gas
  { code: "ArrowDown", label: "▼" }, // brake
  { code: "Enter", label: "↻" },
]);
