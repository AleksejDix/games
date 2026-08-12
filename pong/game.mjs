// ============================================================================
// game.mjs — Pong's IMPERATIVE SHELL
//
// After the shared/ refactor this file keeps only what is PONG'S: the court
// rendering, the difficulty vocabulary, the win/lose jingles. The repeated
// mechanisms (loop, settings persistence, held keys, overlay, audio unlock)
// come from shared/ modules.
// ============================================================================

import * as Pong from "./logic.mjs";
import { render } from "./render.mjs";
import { beep, unlockOnFirstGesture, soundBoard } from "../shared/audio.mjs";
import { bindSettings } from "../shared/settings.mjs";
import { startLoop } from "../shared/loop.mjs";
import { trackHeldKeys, axis } from "../shared/input.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
// Canvas pixels map 1:1 onto court units (800×500), so no scaling math —
// the core's coordinates ARE screen coordinates here.

let state;
let paused = false;

// ----------------------------------------------------------------------------
// SETTINGS — difficulty NAMES are shell vocabulary; the core only ever
// sees the numbers they stand for.
// ----------------------------------------------------------------------------

const DIFFICULTY = {
  easy: { speed: 0.5, deadZone: 30 },   // half-speed stick, sloppy tracking
  normal: { speed: 0.8, deadZone: 12 },
  hard: { speed: 1, deadZone: 4 },      // full chase — beat it with angles
};

const difficultyEl = document.getElementById("difficulty");
const winScoreEl = document.getElementById("winScore");
const soundEl = document.getElementById("sound");
const modeEl = document.getElementById("mode");

const settings = bindSettings({
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
  onWorldChange: () => newGame(),
});

function newGame() {
  state = Pong.createState({
    winScore: settings.winScore,
    ai: DIFFICULTY[settings.difficulty] ?? DIFFICULTY.normal,
  });
  paused = false;
  modeEl.textContent =
    `you vs. cpu · ${settings.difficulty} · first to ${settings.winScore}`;
}

// ----------------------------------------------------------------------------
// INPUT — held keys (shared), pause/restart (ours)
// ----------------------------------------------------------------------------

unlockOnFirstGesture();

const held = trackHeldKeys("ArrowUp", "ArrowDown", "KeyW", "KeyS");

const playerInput = () => axis(held, ["ArrowUp", "KeyW"], ["ArrowDown", "KeyS"]);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (state.status === "playing") paused = !paused;
  }
  if (e.code === "Enter" && state.status === "gameover") newGame();
});

// ----------------------------------------------------------------------------
// SOUND — step() events mapped to bleeps. Wall and paddle sit a musical
// octave apart (220/440 Hz), just like the original cabinet's two thunks.
// ----------------------------------------------------------------------------

// Three-note jingles for the end of a match: the same melody up or down.
function jingle(freqs) {
  freqs.forEach((freq, i) =>
    beep({ freq, duration: 0.14, at: i * 0.11, type: "triangle" })
  );
}

const SOUNDS = {
  wall: () => beep({ freq: 220, duration: 0.05 }),
  paddle: () => beep({ freq: 440, duration: 0.05 }),
  scored: () => beep({ freq: 330, slideTo: 165, duration: 0.25, type: "triangle" }),
  // The winner arrives as event data — no more re-deriving it from scores.
  gameover: (e) =>
    jingle(e.winner === "left" ? [523, 659, 784] : [392, 311, 262]),
};

const sound = soundBoard(SOUNDS, () => settings.sound);

// ----------------------------------------------------------------------------
// WIRE IT UP — Pong ticks at a fixed 120Hz, so stepMs is a constant answer.
// The human drives the left paddle; the core's own aiInput() drives the
// right one. Same signal, different source.
// ----------------------------------------------------------------------------

const STEP_MS = Pong.DT * 1000;

newGame();

startLoop({
  stepMs: () => STEP_MS,
  running: () => state.status === "playing" && !paused,
  update: () => {
    const events = Pong.step(state, {
      left: playerInput(),
      right: Pong.aiInput(state, "right"),
    });
    // The final point produces "scored" AND "gameover" together; skip the
    // plain bloop so the fanfare stands alone.
    const ended = events.some((e) => e.type === "gameover");
    for (const event of events) {
      if (event.type === "scored" && ended) continue;
      sound(event);
    }
  },
  render: () => render(ctx, state, paused),
});
