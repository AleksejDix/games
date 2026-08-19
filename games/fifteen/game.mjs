// ============================================================================
// game.mjs — Fifteen, DECLARED on the turn engine. What remains here is
// only Fifteen's own: tile picking, arrow semantics, the fewest-moves
// record per board size.
// ============================================================================

import * as Fifteen from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";

const sizeEl = document.getElementById("boardSize");

const game = createTurnGame({
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
});


game.canvas.addEventListener("pointerdown", (e) => {
  const state = game.session.state;
  const cell = game.canvas.width / state.size;
  const index = pickCell(game.canvas, e, { cols: state.size, rows: state.size, cell });
  if (index !== -1) game.act(Fifteen.slide(state, index));
});

const KEY_DIRS = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
};

document.addEventListener("keydown", (e) => {
  const dir = KEY_DIRS[e.code];
  if (!dir) return;
  e.preventDefault();
  game.act(Fifteen.slideDirection(game.session.state, dir));
});
