// ============================================================================
// game.mjs — Pong, DECLARED on the engine.
// ============================================================================

import * as Pong from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { trackHeldKeys, axis } from "../../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowUp", "ArrowDown", "KeyW", "KeyS");

// Difficulty NAMES are shell vocabulary; the core only sees the numbers.
const DIFFICULTY = {
  easy: { speed: 0.5, deadZone: 30 },
  normal: { speed: 0.8, deadZone: 12 },
  hard: { speed: 1, deadZone: 4 },
};

const opponentEl = document.getElementById("opponent");
const difficultyEl = document.getElementById("difficulty");
const winScoreEl = document.getElementById("winScore");
const modeEl = document.getElementById("mode");

// Three-note jingles for the end of a match: the same melody up or down.
const jingle = (freqs) =>
  freqs.forEach((freq, i) => beep({ freq, duration: 0.14, at: i * 0.11, type: "triangle" }));

const api = createGame({
  core: Pong,
  render,

  options: (s) => ({
    winScore: s.winScore,
    ai: DIFFICULTY[s.difficulty] ?? DIFFICULTY.normal,
  }),

  settings: {
    storageKey: "pongSettings",
    defaults: { opponent: "cpu", difficulty: "normal", winScore: 11 },
    read: () => ({
      opponent: opponentEl.value,
      difficulty: difficultyEl.value,
      winScore: Number(winScoreEl.value),
    }),
    write: (s) => {
      opponentEl.value = s.opponent;
      difficultyEl.value = s.difficulty;
      winScoreEl.value = String(s.winScore);
    },
    worldEls: [opponentEl, difficultyEl, winScoreEl],
  },

  // Pong was BORN two-player — the core has taken { left, right } inputs
  // all along, and the AI was only ever one possible input source. Versus
  // mode swaps it for a second human: W/S on the left, arrows on the
  // right. Solo keeps both key sets on the human's paddle.
  input: (state) =>
    api.settings.opponent === "human"
      ? {
          left: axis(held, ["KeyW"], ["KeyS"]),
          right: axis(held, ["ArrowUp"], ["ArrowDown"]),
        }
      : {
          left: axis(held, ["ArrowUp", "KeyW"], ["ArrowDown", "KeyS"]),
          right: Pong.aiInput(state, "right"),
        },

  // The start card: while the court is ready, 1/2 pick the opponent (the
  // 1972 cabinet's start buttons) and Space serves. Picking writes the
  // select and fires its change event, so the ordinary settings wiring
  // persists it and rebuilds the world — still ready, mode applied.
  special: (e, apiRef) => {
    if (apiRef.state.status !== "ready") return false;
    const pick = { Digit1: "cpu", Digit2: "human" }[e.code];
    if (pick) {
      opponentEl.value = pick;
      opponentEl.dispatchEvent(new Event("change"));
      return true;
    }
    if (e.code === "Space") {
      e.preventDefault();
      apiRef.dispatch(Pong.start(apiRef.state));
      return true;
    }
    return false;
  },

  // The final point produces "scored" AND "gameover" together — drop the
  // plain bloop so the fanfare stands alone.
  filterEvents: (events) =>
    events.some((e) => e.type === "gameover")
      ? events.filter((e) => e.type !== "scored")
      : events,

  sounds: {
    started: () => beep({ freq: 660, duration: 0.05 }),
    wall: () => beep({ freq: 220, duration: 0.05 }),
    paddle: () => beep({ freq: 440, duration: 0.05 }),
    scored: () => beep({ freq: 330, slideTo: 165, duration: 0.25, type: "triangle" }),
    gameover: (e) => jingle(e.winner === "left" ? [523, 659, 784] : [392, 311, 262]),
  },

  onNewGame: (state, s) =>
    (modeEl.textContent =
      s.opponent === "human"
        ? `W/S vs. arrows · first to ${s.winScore}`
        : `you vs. cpu · ${s.difficulty} · first to ${s.winScore}`),
});

// A tap on the court serves too — the touch answer to Space.
document.getElementById("game").addEventListener("pointerdown", () => {
  if (api.state.status === "ready") api.dispatch(Pong.start(api.state));
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
// 1P/2P pick the mode on the start card; the W/S pair only matters in
// versus mode (left player) — solo, either pair drives the one paddle.
touchControls([
  { code: "Digit1", label: "1P" },
  { code: "Digit2", label: "2P" },
  { code: "KeyW", label: "W" },
  { code: "KeyS", label: "S" },
  { code: "ArrowUp", label: "▲" },
  { code: "ArrowDown", label: "▼" },
  { code: "Enter", label: "↻" },
]);
