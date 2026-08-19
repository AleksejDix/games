// ============================================================================
// game.mjs — Reversi, DECLARED on the turn engine. One-click play: tap a
// glowing square, the flanked discs turn. What remains here is only
// Reversi's own: the disc count HUD, and a machine that may keep the
// turn when a pass hands it back (the engine's re-schedule covers it).
// ============================================================================

import * as Reversi from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare, click, drawChime } from "../../shared/audio.mjs";
import { boardGeometry } from "../../shared/board.mjs";

createTurnGame({
  core: Reversi,
  render,
  options: () => ({}),
  sounds: {
    placed: () => click(),
    flipped: () => beep({ freq: 220, duration: 0.07, volume: 0.08 }),
    passed: () => beep({ freq: 280, slideTo: 160, duration: 0.15, volume: 0.1 }),
    won: () => fanfare(),
    draw: () => drawChime(),
  },
  hud: (state) => {
    const count = (side) => state.cells.filter((d) => d === side).length;
    const black = count("black");
    const white = count("white");
    return {
      score:
        state.status === "won"
          ? state.winner === "black"
            ? `black wins ${black} : ${white}`
            : `white wins ${white} : ${black}`
          : state.status === "draw"
            ? `a draw ${black} : ${white}`
            : `${state.turn === "black" ? "▶" : ""}black ${black} · ` +
              `${state.turn === "white" ? "▶" : ""}white ${white}`,
    };
  },
  pick: {
    board: (state, canvas) => boardGeometry(canvas, Reversi.SIZE),
    action: (state, index) => Reversi.place(state, index),
  },
  opponent: {
    title: "REVERSI",
    side: "white",
    play: (state) => {
      const m = Reversi.botMove(state);
      return m !== null ? Reversi.place(state, m) : [];
    },
  },
});
