// ============================================================================
// game.mjs — Lights Out, on the turn engine. Only its own: cell picking
// and the fewest-presses record per scramble depth.
// ============================================================================

import * as Lights from "./logic.mjs";
import { render } from "./render.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";


createTurnGame({
  core: Lights,
  render,
  options: (s) => ({ scrambles: s.scrambles }),
  settings: {
    controls: { scrambles: 12 },
  },
  sounds: {
    toggled: () => beep({ freq: 340, duration: 0.05, volume: 0.08 }),
    solved: () => fanfare(),
  },
  hud: (state) => ({ score: state.moves }),
  fewestBest: (s) => `lightsoutBest.${s.scrambles}`,
  pick: {
    board: (state, canvas) => boardGeometry(canvas, state.size),
    action: (state, index) => Lights.toggle(state, index),
  },
});
