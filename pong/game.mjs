// ============================================================================
// game.mjs — Pong, DECLARED on the engine.
// ============================================================================

import * as Pong from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../shared/engine.mjs";
import { beep } from "../shared/audio.mjs";
import { trackHeldKeys, axis } from "../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowUp", "ArrowDown", "KeyW", "KeyS");

// Difficulty NAMES are shell vocabulary; the core only sees the numbers.
const DIFFICULTY = {
  easy: { speed: 0.5, deadZone: 30 },
  normal: { speed: 0.8, deadZone: 12 },
  hard: { speed: 1, deadZone: 4 },
};

const difficultyEl = document.getElementById("difficulty");
const winScoreEl = document.getElementById("winScore");
const soundEl = document.getElementById("sound");
const modeEl = document.getElementById("mode");

// Three-note jingles for the end of a match: the same melody up or down.
const jingle = (freqs) =>
  freqs.forEach((freq, i) => beep({ freq, duration: 0.14, at: i * 0.11, type: "triangle" }));

createGame({
  core: Pong,
  render,

  options: (s) => ({
    winScore: s.winScore,
    ai: DIFFICULTY[s.difficulty] ?? DIFFICULTY.normal,
  }),

  settings: {
    storageKey: "pongSettings",
    defaults: { difficulty: "normal", winScore: 11, sound: true },
    read: () => ({
      difficulty: difficultyEl.value,
      winScore: Number(winScoreEl.value),
      sound: soundEl.checked,
    }),
    write: (s) => {
      difficultyEl.value = s.difficulty;
      winScoreEl.value = String(s.winScore);
      soundEl.checked = s.sound;
    },
    worldEls: [difficultyEl, winScoreEl],
    presentationEls: [soundEl],
  },

  // The human drives the left paddle; the core's own aiInput() the right.
  input: (state) => ({
    left: axis(held, ["ArrowUp", "KeyW"], ["ArrowDown", "KeyS"]),
    right: Pong.aiInput(state, "right"),
  }),

  // The final point produces "scored" AND "gameover" together — drop the
  // plain bloop so the fanfare stands alone.
  filterEvents: (events) =>
    events.some((e) => e.type === "gameover")
      ? events.filter((e) => e.type !== "scored")
      : events,

  sounds: {
    wall: () => beep({ freq: 220, duration: 0.05 }),
    paddle: () => beep({ freq: 440, duration: 0.05 }),
    scored: () => beep({ freq: 330, slideTo: 165, duration: 0.25, type: "triangle" }),
    gameover: (e) => jingle(e.winner === "left" ? [523, 659, 784] : [392, 311, 262]),
  },

  onNewGame: (state, s) =>
    (modeEl.textContent = `you vs. cpu · ${s.difficulty} · first to ${s.winScore}`),
});
