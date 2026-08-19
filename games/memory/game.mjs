// ============================================================================
// game.mjs — Memory, DECLARED on the turn engine. What remains here is
// only Memory's own: card picking through the renderer's geometry, the
// 750ms settle beat, and the fewest-tries record per deck size.
// ============================================================================

import * as Memory from "./logic.mjs";
import { render, boardGeometry } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";

const pairsEl = document.getElementById("pairs");

const game = createTurnGame({
  core: Memory,
  render,
  options: (s) => ({ pairs: s.pairs }),
  settings: {
    storageKey: "memorySettings",
    defaults: { pairs: 8 },
    read: () => ({ pairs: Number(pairsEl.value) }),
    write: (s) => {
      pairsEl.value = String(s.pairs);
    },
    worldEls: [pairsEl],
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
  fewestBest: (s) => `memoryBest.${s.pairs}`,
  afterAct: (state, events) => {
    // The settle beat: a mismatch lingers long enough to memorize, then
    // turns back. settle() self-guards, so restarts and early third
    // flips during the wait are harmless.
    if (events.some((e) => e.type === "mismatched")) {
      setTimeout(() => game.act(Memory.settle(game.session.state)), 750);
    }
  },
});


game.canvas.addEventListener("pointerdown", (e) => {
  const state = game.session.state;
  const index = pickCell(game.canvas, e, boardGeometry(state, game.canvas));
  if (index !== -1) game.act(Memory.flip(state, index));
});
