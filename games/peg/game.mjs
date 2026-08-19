// ============================================================================
// game.mjs — Peg Solitaire, on the turn engine. Two-click play: pick a
// peg up (it glows, landings ring), then put it somewhere legal. Best is
// FEWEST PEGS LEFT — recorded at either ending.
// ============================================================================

import * as Peg from "./logic.mjs";
import { render } from "./render.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";

createTurnGame({
  core: Peg,
  render,
  options: () => ({}),
  settings: { storageKey: "pegSettings" }, // #sound binds by convention
  sounds: {
    jumped: () => beep({ freq: 500, slideTo: 320, duration: 0.07, volume: 0.08 }),
    solved: () => fanfare(),
    stuck: () => {
      beep({ freq: 330, duration: 0.14, type: "triangle" });
      beep({ freq: 262, duration: 0.2, at: 0.16, type: "triangle" });
    },
  },
  hud: (state) => ({ score: state.pegs }),
  fewestBest: () => "pegBest",
  bestValue: (state) => state.pegs, // fewest left standing, not fewest moves
  pick: {
    board: (state, canvas) => boardGeometry(canvas, Peg.SIZE),
    action: (state, index) => {
      if (state.board[index] === true) {
        state.selected = state.selected === index ? null : index; // pick up / put down
        return;
      }
      if (state.selected !== null) {
        const from = state.selected;
        state.selected = null;
        return Peg.jump(state, from, index);
      }
    },
  },
});
