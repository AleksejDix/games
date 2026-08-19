// ============================================================================
// game.mjs — Fifteen, on a BARE SESSION. No createGame, no clock, no
// pause: this is the game the session/clock split was built for. The
// session provides settings, sounds, dispatch, and restart-on-terminal;
// this file renders after each ACTION instead of each tick.
// ============================================================================

import * as Fifteen from "./logic.mjs";
import { render } from "./render.mjs";
import { createSession } from "../../shared/session.mjs";
import { beep } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";
import { touchControls } from "../../shared/touch.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const movesEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const sizeEl = document.getElementById("boardSize");
const soundEl = document.getElementById("sound");

const session = createSession({
  core: Fifteen,
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
});

// --- best score, by hand: fewest moves wins, so trackBest's "higher is
// better" doesn't fit. Kept per board size — a 3×3 record is not a 5×5 one.
const bestKey = () => `fifteenBest.${session.state.size}`;
const showBest = () => (bestEl.textContent = localStorage[bestKey()] ?? "–");

function recordBest() {
  const best = Number(localStorage[bestKey()] ?? Infinity);
  localStorage[bestKey()] = Math.min(best, session.state.moves);
  showBest();
}

// --- turn-based wiring: act, dispatch, draw — no loop anywhere ------------------

function draw() {
  render(ctx, session.state, false);
  movesEl.textContent = session.state.moves;
}

function act(events) {
  session.dispatch(events);
  if (session.state.status === "solved") recordBest();
  draw();
}

canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosition(canvas, e);
  const cell = canvas.width / session.state.size;
  const index =
    Math.floor(p.y / cell) * session.state.size + Math.floor(p.x / cell);
  act(Fifteen.slide(session.state, index));
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
  act(Fifteen.slideDirection(session.state, dir));
});

// A new shuffle (Enter via the session, or a settings change) redraws.
session.onReset(() => {
  showBest();
  draw();
});

// Tiles are tappable, so phones need only a restart thumb.
touchControls([{ code: "Enter", label: "↻" }]);

showBest();
draw();
