// ============================================================================
// game.mjs — Chess, DECLARED on the turn engine. Checkers' shell with a
// deeper core behind it: two-click play, the machine on black. Pawns
// promote to queens here — the core knows all four crowns, the shell
// keeps the common case frictionless.
// ============================================================================

import * as Chess from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare, drawChime, click } from "../../shared/audio.mjs";
import { boardGeometry } from "../../shared/board.mjs";

const game = createTurnGame({
  core: Chess,
  render,
  options: () => ({}),
  sounds: {
    moved: () => click(),
    captured: () => beep({ freq: 180, slideTo: 120, duration: 0.12, volume: 0.1 }),
    castled: () => {
      beep({ freq: 300, duration: 0.05, volume: 0.08 });
      beep({ freq: 400, duration: 0.05, at: 0.06, volume: 0.08 });
    },
    promoted: () => beep({ freq: 660, slideTo: 990, duration: 0.15, volume: 0.09 }),
    check: () => beep({ freq: 550, duration: 0.1, type: "triangle", volume: 0.1 }),
    won: () => fanfare(),
    draw: () => drawChime(),
  },
  hud: (state) => ({
    score:
      state.status === "won" ? `${state.winner} wins` :
      state.status === "draw" ? "a draw" :
      `${state.turn} to move${Chess.inCheck(state, state.turn) ? " · check!" : ""}`,
  }),
  afterAct: (state) => (state.selected = null),
  pick: {
    board: (state, canvas) => boardGeometry(canvas, Chess.SIZE),
    action: (state, index) => {
      const piece = state.cells[index];
      if (piece && piece.side === state.turn) {
        // Pick up / put down — the render glows the hand and its landings.
        state.selected = state.selected === index ? null : index;
        return;
      }
      if (state.selected !== null && state.selected !== undefined) {
        return Chess.move(state, state.selected, index); // pawns crown as queens
      }
    },
  },
  opponent: {
    title: "CHESS",
    side: "black",
    delay: 450, // the deeper search earns a longer look
    play: (state) => {
      const m = Chess.botMove(state);
      return m ? Chess.move(state, m.from, m.to, m.promo) : [];
    },
  },
});

