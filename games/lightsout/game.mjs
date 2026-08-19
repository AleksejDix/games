// ============================================================================
// game.mjs — Lights Out, on the turn engine. Only its own: cell picking
// and the fewest-presses record per scramble depth.
// ============================================================================

import * as Lights from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { trackBestFewest } from "../../shared/score.mjs";
import { beep } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";

const scramblesEl = document.getElementById("scrambles");
const soundEl = document.getElementById("sound");

const game = createTurnGame({
  core: Lights,
  render,
  options: (s) => ({ scrambles: s.scrambles }),
  settings: {
    storageKey: "lightsoutSettings",
    defaults: { scrambles: 12, sound: true },
    read: () => ({ scrambles: Number(scramblesEl.value), sound: soundEl.checked }),
    write: (s) => {
      scramblesEl.value = String(s.scrambles);
      soundEl.checked = s.sound;
    },
    worldEls: [scramblesEl],
    presentationEls: [soundEl],
  },
  sounds: {
    toggled: () => beep({ freq: 340, duration: 0.05, volume: 0.08 }),
    solved: () =>
      [523, 659, 784, 1047].forEach((freq, i) =>
        beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
      ),
  },
  hud: (state) => ({ score: state.moves }),
  afterAct: (state) => {
    if (state.status === "solved") best.record(state.moves);
  },
});

const best = trackBestFewest(
  () => `lightsoutBest.${game.session.settings.scrambles}`,
  document.getElementById("best")
);
game.session.onReset(best.show);

game.canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosition(game.canvas, e);
  const state = game.session.state;
  const cell = game.canvas.width / state.size;
  game.act(Lights.toggle(state, Math.floor(p.y / cell) * state.size + Math.floor(p.x / cell)));
});
