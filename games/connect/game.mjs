// ============================================================================
// game.mjs — Connect Four, DECLARED on the turn engine. What remains
// here is only Connect Four's own: a click means a COLUMN (any cell in
// it — gravity picks the row), and the machine plays gold.
// ============================================================================

import * as Connect from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare, drawChime } from "../../shared/audio.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { turnLine } from "../../shared/score.mjs";

createTurnGame({
  core: Connect,
  render,
  options: () => ({}),
  sounds: {
    // The landing thunk, pitched by how far the disc fell: a long drop
    // to the floor lands lower than a disc topping off a stack.
    dropped: (e) =>
      beep({ freq: 460 - Math.floor(e.index / Connect.COLS) * 36, duration: 0.05, volume: 0.08 }),
    won: () => fanfare(),
    draw: () => drawChime(),
  },
  hud: (state) => ({
    score:
      state.status === "won" ? `${state.winner} wins` :
      state.status === "draw" ? "a draw" :
      turnLine(state.turn, ["red", "gold"]),
  }),
  pick: {
    board: (state, canvas) => boardGeometry(canvas, Connect.COLS, Connect.ROWS),
    // Any cell in a column means that COLUMN — gravity does the aiming.
    action: (state, index) => Connect.drop(state, index % Connect.COLS),
  },
  opponent: {
    title: "CONNECT FOUR",
    side: "gold",
    play: (state) => Connect.drop(state, Connect.botMove(state)),
  },
});
