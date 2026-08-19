// ============================================================================
// game.mjs — Flappy, DECLARED on the clocked engine. One verb: tap the
// canvas, press Space, or hit the thumb button — all of them flap().
// The ready hover starts on the first flap (Breakout's serving, airborne).
// ============================================================================

import * as Flappy from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";

const canvas = document.getElementById("game");
const gapEl = document.getElementById("gap");

const api = createGame({
  core: Flappy,
  render,
  options: (s) => ({ gap: s.gap }),
  settings: {
    storageKey: "flappySettings",
    defaults: { gap: 150 },
    read: () => ({ gap: Number(gapEl.value) }),
    write: (s) => {
      gapEl.value = String(s.gap);
    },
    worldEls: [gapEl],
  },
  keys: { pause: "KeyP" }, // Space flaps
  runningStatuses: ["playing"], // the ready hover is still — render runs anyway
  special: (e, apiRef) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      if (!e.repeat) apiRef.dispatch(Flappy.flap(apiRef.state)); // taps, not holds
      return true;
    }
    return false;
  },
  sounds: {
    flapped: () => beep({ freq: 240, slideTo: 520, duration: 0.08, volume: 0.08 }),
    passed: () => beep({ freq: 880, duration: 0.06, volume: 0.09 }),
    died: () => {
      beep({ freq: 200, duration: 0.06, volume: 0.12 });
      beep({ freq: 300, slideTo: 60, duration: 0.5, at: 0.07, type: "sawtooth" });
    },
  },
  best: { key: "flappyBest", on: ["died"] },
  hud: (state) => ({ score: state.score }),
});

canvas.addEventListener("pointerdown", () => {
  if (api.paused) return; // flapping while paused would bank a free leap for the resume
  api.dispatch(Flappy.flap(api.state));
});

touchControls([{ code: "Enter", label: "↻" }]);
