// ============================================================================
// game.mjs — Lights Out, on the turn engine. Only its own: cell picking
// and the fewest-presses record per scramble depth.
// ============================================================================

import * as Lights from "./logic.mjs";
import { render } from "./render.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";

const scramblesEl = document.getElementById("scrambles");

const game = createTurnGame({
  core: Lights,
  render,
  options: (s) => ({ scrambles: s.scrambles }),
  settings: {
    storageKey: "lightsoutSettings",
    defaults: { scrambles: 12 },
    read: () => ({ scrambles: Number(scramblesEl.value) }),
    write: (s) => {
      scramblesEl.value = String(s.scrambles);
    },
    worldEls: [scramblesEl],
  },
  sounds: {
    toggled: () => beep({ freq: 340, duration: 0.05, volume: 0.08 }),
    solved: () => fanfare(),
  },
  hud: (state) => ({ score: state.moves }),
  fewestBest: (s) => `lightsoutBest.${s.scrambles}`,
});


game.canvas.addEventListener("pointerdown", (e) => {
  const state = game.session.state;
  const cell = courtSize(game.canvas).width / state.size;
  const index = pickCell(game.canvas, e, { cols: state.size, rows: state.size, cell });
  if (index !== -1) game.act(Lights.toggle(state, index));
});
