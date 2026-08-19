// ============================================================================
// game.mjs — Checkers, DECLARED on the turn engine. Two-click play like
// Peg: pick a piece up, put it on a glowing square. What remains here is
// only Checkers' own: the hand, the chain's auto-hold, and a machine
// whose capture chains ride the engine's re-schedule, one visible jump
// at a time.
// ============================================================================

import * as Checkers from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { boardGeometry } from "../../shared/board.mjs";

const game = createTurnGame({
  core: Checkers,
  render,
  options: () => ({}),
  settings: { storageKey: "checkersSettings" },
  sounds: {
    moved: () => beep({ freq: 300, duration: 0.04, volume: 0.07 }),
    captured: () => beep({ freq: 180, slideTo: 120, duration: 0.12, volume: 0.1 }),
    crowned: () => {
      beep({ freq: 660, duration: 0.08 });
      beep({ freq: 990, duration: 0.12, at: 0.09 });
    },
    won: () => fanfare(),
  },
  hud: (state) => {
    const count = (side) => state.cells.filter((p) => p?.side === side).length;
    return {
      score:
        state.status === "won"
          ? `${state.winner} wins`
          : `${state.turn === "red" ? "▶" : ""}red ${count("red")} · ` +
            `${state.turn === "white" ? "▶" : ""}white ${count("white")}`,
    };
  },
  // A chain locks the hand to the jumping piece; otherwise it empties.
  afterAct: (state) => (state.selected = state.chained),
  pick: {
    board: (state, canvas) => boardGeometry(canvas, Checkers.SIZE),
    action: (state, index) => {
      const piece = state.cells[index];
      if (state.chained === null && piece && piece.side === state.turn) {
        // Pick up / put down — the render glows the hand and its landings.
        state.selected = state.selected === index ? null : index;
        return;
      }
      if (state.selected !== null && state.selected !== undefined) {
        return Checkers.move(state, state.selected, index);
      }
    },
  },
  opponent: {
    title: "CHECKERS",
    side: "white",
    play: (state) => {
      const m = Checkers.botMove(state);
      return m ? Checkers.move(state, m.from, m.to) : [];
    },
  },
});

game.session.onReset(() => (game.session.state.selected = null));
game.session.state.selected = null; // cosmetic: the piece in hand (render reads it)
