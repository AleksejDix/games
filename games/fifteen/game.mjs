// ============================================================================
// game.mjs — Fifteen, DECLARED on the turn engine. What remains here is
// only Fifteen's own: tile picking, arrow semantics, the fewest-moves
// record per board size.
// ============================================================================

import * as Fifteen from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { trackBestFewest } from "../../shared/score.mjs";
import { beep } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";

const sizeEl = document.getElementById("boardSize");
const soundEl = document.getElementById("sound");

const game = createTurnGame({
  core: Fifteen,
  render,
  options: (s) => ({ size: s.size }),
  settings: {
    storageKey: "fifteenSettings",
    defaults: { size: 4, sound: true },
    read: () => ({ size: Number(sizeEl.value), sound: soundEl.checked }),
    write: (s) => {
      sizeEl.value = String(s.size);
      soundEl.checked = s.sound;
    },
    worldEls: [sizeEl],
    presentationEls: [soundEl],
  },
  sounds: {
    // A soft tick per slide, pitched by the tile — the board plinks.
    slid: (e) => beep({ freq: 240 + e.tile * 8, duration: 0.04, volume: 0.07 }),
    solved: () =>
      [523, 659, 784, 1047].forEach((freq, i) =>
        beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
      ),
  },
  hud: (state) => ({ score: state.moves }),
  afterAct: (state) => {
    if (state.status === "solved") best.record(state.moves);
  },
});

const best = trackBestFewest(
  () => `fifteenBest.${game.session.state.size}`,
  document.getElementById("best")
);
game.session.onReset(best.show);

game.canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosition(game.canvas, e);
  const state = game.session.state;
  const cell = game.canvas.width / state.size;
  game.act(Fifteen.slide(state, Math.floor(p.y / cell) * state.size + Math.floor(p.x / cell)));
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
