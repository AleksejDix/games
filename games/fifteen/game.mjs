// ============================================================================
// game.mjs — Fifteen, DECLARED on the turn engine. What remains here is
// only Fifteen's own: tile picking, arrow semantics, the fewest-moves
// record per board size.
// ============================================================================

import * as Fifteen from "./logic.mjs";
import { render } from "./render.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";

const sizeEl = document.getElementById("boardSize");

// One table, four directions across two key rows — the turn engine wires it.
const ACTIONS = Object.fromEntries(
  Object.entries({
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
  }).map(([code, dir]) => [code, (s) => Fifteen.slideDirection(s, dir)])
);

createTurnGame({
  core: Fifteen,
  render,
  options: (s) => ({ size: s.size }),
  settings: {
    storageKey: "fifteenSettings",
    defaults: { size: 4 },
    read: () => ({ size: Number(sizeEl.value) }),
    write: (s) => {
      sizeEl.value = String(s.size);
    },
    worldEls: [sizeEl],
  },
  sounds: {
    // A soft tick per slide, pitched by the tile — the board plinks.
    slid: (e) => beep({ freq: 240 + e.tile * 8, duration: 0.04, volume: 0.07 }),
    solved: () => fanfare(),
  },
  hud: (state) => ({ score: state.moves }),
  fewestBest: (s) => `fifteenBest.${s.size}`,
  actions: ACTIONS,
  pick: {
    board: (state, canvas) => boardGeometry(canvas, state.size),
    action: (state, index) => Fifteen.slide(state, index),
  },
});
