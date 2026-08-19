// ============================================================================
// game.mjs — Memory, DECLARED on the turn engine. What remains here is
// only Memory's own: card picking through the renderer's geometry, the
// 750ms settle beat, and the fewest-tries record per deck size.
// ============================================================================

import * as Memory from "./logic.mjs";
import { render, boardGeometry } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { trackBestFewest } from "../../shared/score.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";

const pairsEl = document.getElementById("pairs");
const soundEl = document.getElementById("sound");

const game = createTurnGame({
  core: Memory,
  render,
  options: (s) => ({ pairs: s.pairs }),
  settings: {
    storageKey: "memorySettings",
    defaults: { pairs: 8, sound: true },
    read: () => ({ pairs: Number(pairsEl.value), sound: soundEl.checked }),
    write: (s) => {
      pairsEl.value = String(s.pairs);
      soundEl.checked = s.sound;
    },
    worldEls: [pairsEl],
    presentationEls: [soundEl],
  },
  sounds: {
    flipped: (e) => beep({ freq: 420 + e.value * 24, duration: 0.05, volume: 0.08 }),
    matched: () => {
      beep({ freq: 660, duration: 0.07 });
      beep({ freq: 990, duration: 0.1, at: 0.08 });
    },
    mismatched: () => beep({ freq: 150, duration: 0.12, volume: 0.08 }),
    solved: () => fanfare(),
  },
  hud: (state) => ({ score: state.moves }),
  afterAct: (state, events) => {
    if (state.status === "solved") best.record(state.moves);
    // The settle beat: a mismatch lingers long enough to memorize, then
    // turns back. settle() self-guards, so restarts and early third
    // flips during the wait are harmless.
    if (events.some((e) => e.type === "mismatched")) {
      setTimeout(() => game.act(Memory.settle(game.session.state)), 750);
    }
  },
});

const best = trackBestFewest(
  () => `memoryBest.${game.session.state.pairs}`,
  document.getElementById("best")
);
game.session.onReset(best.show);

game.canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosition(game.canvas, e);
  const state = game.session.state;
  const { cols, rows, cell, x0, y0 } = boardGeometry(state, game.canvas);
  const col = Math.floor((p.x - x0) / cell);
  const row = Math.floor((p.y - y0) / cell);
  if (col < 0 || col >= cols || row < 0 || row >= rows) return;
  game.act(Memory.flip(state, row * cols + col));
});
