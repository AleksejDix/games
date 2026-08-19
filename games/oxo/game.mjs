// ============================================================================
// game.mjs — OXO, DECLARED on the turn engine. What remains here is only
// OXO's own: the status line, the machine playing O with a short 300ms
// pause, and the beeps.
// ============================================================================

import * as Oxo from "./logic.mjs";
import { render } from "./render.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";

createTurnGame({
  core: Oxo,
  render,
  options: () => ({}),
  settings: { storageKey: "oxoSettings" },
  sounds: {
    placed: (e) => beep({ freq: e.mark === "X" ? 660 : 440, duration: 0.05, volume: 0.08 }),
    won: () => fanfare(),
    draw: () => {
      beep({ freq: 392, duration: 0.12, type: "triangle" });
      beep({ freq: 392, duration: 0.18, at: 0.14, type: "triangle" });
    },
  },
  hud: (state) => ({
    score:
      state.status === "won" ? `${state.winner} wins` :
      state.status === "draw" ? "a draw" :
      `${state.turn} to move`,
  }),
  pick: {
    board: (state, canvas) => boardGeometry(canvas, 3),
    action: (state, index) => Oxo.place(state, index),
  },
  opponent: {
    title: "OXO",
    side: "O",
    delay: 300, // the 1952 machine answered promptly
    play: (state) => Oxo.place(state, Oxo.botMove(state)),
  },
});
