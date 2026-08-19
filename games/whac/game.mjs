// ============================================================================
// game.mjs — Whac-a-Mole, DECLARED on the clocked engine. The mallet is
// the pointer, dispatched through the api like Missile Command's clicks.
// ============================================================================

import * as Whac from "./logic.mjs";
import { render, holeGeometry } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";
import { touchControls } from "../../shared/touch.mjs";

const canvas = document.getElementById("game");
const paceEl = document.getElementById("pace");
const soundEl = document.getElementById("sound");

const PACE = { calm: 0.8, classic: 1.2, frantic: 1.9 };

const api = createGame({
  core: Whac,
  render,
  options: (s) => ({ rate: PACE[s.pace] ?? PACE.classic }),
  settings: {
    storageKey: "whacSettings",
    defaults: { pace: "classic", sound: true },
    read: () => ({ pace: paceEl.value, sound: soundEl.checked }),
    write: (s) => {
      paceEl.value = s.pace;
      soundEl.checked = s.sound;
    },
    worldEls: [paceEl],
    presentationEls: [soundEl],
  },
  sounds: {
    popped: () => beep({ freq: 300, slideTo: 480, duration: 0.07, volume: 0.07 }),
    whacked: () => {
      beep({ freq: 110, duration: 0.05, volume: 0.12 });
      beep({ freq: 660, duration: 0.06, at: 0.05 });
    },
    whiffed: () => beep({ freq: 90, duration: 0.08, volume: 0.07 }),
    timeUp: () => beep({ freq: 392, slideTo: 130, duration: 0.7, type: "triangle" }),
  },
  best: { key: "whacBest", on: ["timeUp"] },
  hud: (state) => ({ score: state.score }),
});

canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosition(canvas, e);
  const { x0, y0, cell } = holeGeometry(canvas);
  const col = Math.floor((p.x - x0) / cell);
  const row = Math.floor((p.y - y0) / cell);
  if (col < 0 || col > 2 || row < 0 || row > 2) return;
  api.dispatch(Whac.whack(api.state, row * 3 + col));
});

touchControls([{ code: "Enter", label: "↻" }]);
