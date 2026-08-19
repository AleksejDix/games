// ============================================================================
// game.mjs — Peg Solitaire, on the turn engine. Two-click play: pick a
// peg up (it glows, landings ring), then put it somewhere legal. Best is
// FEWEST PEGS LEFT — recorded at either ending.
// ============================================================================

import * as Peg from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";

const game = createTurnGame({
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
});

game.canvas.addEventListener("pointerdown", (e) => {
  const state = game.session.state;
  if (state.status !== "playing") return; // a finished board takes no picks
  const index = pickCell(game.canvas, e, {
    cols: Peg.SIZE,
    rows: Peg.SIZE,
    cell: game.canvas.width / Peg.SIZE,
  });
  if (index === -1) return;
  if (state.board[index] === true) {
    state.selected = state.selected === index ? null : index; // pick up / put down
    game.draw();
  } else if (state.selected !== null) {
    const from = state.selected;
    state.selected = null;
    game.act(Peg.jump(state, from, index));
  }
});
