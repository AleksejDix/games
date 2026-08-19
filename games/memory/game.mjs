// ============================================================================
// game.mjs — Memory, on a bare session. The ONLY timer in this shell is
// the settle beat: a mismatched pair lingers 750ms so it can be
// memorized, then the shell dispatches settle() — the core knows the
// rule, the shell owns the clock, as always.
// ============================================================================

import * as Memory from "./logic.mjs";
import { render, boardGeometry } from "./render.mjs";
import { createSession } from "../../shared/session.mjs";
import { beep } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";
import { touchControls } from "../../shared/touch.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const movesEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const pairsEl = document.getElementById("pairs");
const soundEl = document.getElementById("sound");

const session = createSession({
  core: Memory,
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
    settled: () => {},
    solved: () =>
      [523, 659, 784, 1047].forEach((freq, i) =>
        beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
      ),
  },
});

// Best = FEWEST attempts, kept per deck size.
const bestKey = () => `memoryBest.${session.state.pairs}`;
const showBest = () => (bestEl.textContent = localStorage[bestKey()] ?? "–");

function draw() {
  render(ctx, session.state, false);
  movesEl.textContent = session.state.moves;
}

function act(events) {
  session.dispatch(events);
  if (session.state.status === "solved") {
    const best = Number(localStorage[bestKey()] ?? Infinity);
    localStorage[bestKey()] = Math.min(best, session.state.moves);
    showBest();
  }
  // The settle beat: after a mismatch, let it linger long enough to
  // memorize, then turn it back. settle() self-guards, so a restart or
  // an early third flip during the wait is harmless.
  if (events.some((e) => e.type === "mismatched")) {
    setTimeout(() => {
      act(Memory.settle(session.state));
    }, 750);
  }
  draw();
}

canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosition(canvas, e);
  const { cols, rows, cell, x0, y0 } = boardGeometry(session.state, canvas);
  const col = Math.floor((p.x - x0) / cell);
  const row = Math.floor((p.y - y0) / cell);
  if (col < 0 || col >= cols || row < 0 || row >= rows) return;
  act(Memory.flip(session.state, row * cols + col));
});

session.onReset(() => {
  showBest();
  draw();
});
touchControls([{ code: "Enter", label: "↻" }]);
showBest();
draw();
