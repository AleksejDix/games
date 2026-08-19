// ============================================================================
// game.mjs — Missile Command, DECLARED on the engine.
//
// The first pointer game — and the engine needed ZERO changes for it,
// which was the whole point of evicting input: the game owns its device
// (trackPointer for the crosshair), and firing is an ACTION dispatched
// from the click handler, exactly like Breakout's launch.
// ============================================================================

import * as Missiles from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { trackPointer, pointerPosition } from "../../shared/input.mjs";

const canvas = document.getElementById("game");
const pointer = trackPointer(canvas); // the game owns its input DEVICE

const ammoEl = document.getElementById("ammo");
const soundEl = document.getElementById("sound");

const api = createGame({
  core: Missiles,
  render,

  options: (s) => ({ ammo: s.ammo }),

  settings: {
    storageKey: "missilesSettings",
    defaults: { ammo: 10, sound: true },
    read: () => ({ ammo: Number(ammoEl.value), sound: soundEl.checked }),
    write: (s) => {
      ammoEl.value = String(s.ammo);
      soundEl.checked = s.sound;
    },
    worldEls: [ammoEl],
    presentationEls: [soundEl],
  },

  input: () => ({ aim: { x: pointer.x, y: pointer.y } }),
  runningStatuses: ["playing", "debrief"], // the debrief must tick to end

  sounds: {
    fired: () => beep({ freq: 220, slideTo: 880, duration: 0.12, volume: 0.07 }),
    empty: () => beep({ freq: 110, duration: 0.05, volume: 0.08 }),
    boom: () => beep({ freq: 130, slideTo: 40, duration: 0.4, type: "sawtooth", volume: 0.12 }),
    kill: () => beep({ freq: 880, duration: 0.05, volume: 0.08 }),
    impact: () => beep({ freq: 90, slideTo: 30, duration: 0.5, type: "sawtooth", volume: 0.18 }),
    waveEnd: () => {
      beep({ freq: 523, duration: 0.09, type: "triangle" });
      beep({ freq: 784, duration: 0.12, at: 0.1, type: "triangle" });
    },
    wave: () => beep({ freq: 392, slideTo: 523, duration: 0.15, type: "triangle" }),
    died: () => beep({ freq: 180, slideTo: 30, duration: 1.0, type: "sawtooth" }),
  },

  best: { key: "missilesBest", on: ["died"] },
  hud: (state) => ({
    score: state.score,
    lives: "⌂".repeat(state.cities.filter((c) => c.alive).length),
  }),
});

// Firing is an action at a point — dispatched through the same funnel as
// everything else, so the sounds and best-score reactions come for free.
canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosition(canvas, e);
  api.dispatch(Missiles.launch(api.state, p.x, p.y));
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls([
  { code: "Enter", label: "↻" }, // aiming and firing are already touch-native
]);
