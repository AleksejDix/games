// ============================================================================
// game.mjs — Pong's IMPERATIVE SHELL
//
// After the shared/ refactor this file keeps only what is PONG'S: the court
// rendering, the difficulty vocabulary, the win/lose jingles. The repeated
// mechanisms (loop, settings persistence, held keys, overlay, audio unlock)
// come from shared/ modules.
// ============================================================================

import * as Pong from "./logic.mjs";
import { beep, unlockOnFirstGesture } from "../shared/audio.mjs";
import { loadSettings, saveSettings } from "../shared/settings.mjs";
import { startLoop } from "../shared/loop.mjs";
import { trackHeldKeys, axis } from "../shared/input.mjs";
import { drawOverlay } from "../shared/overlay.mjs";
import { cssVar } from "../shared/theme.mjs";

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

const DEFAULT_SETTINGS = { difficulty: "normal", winScore: 11, sound: true };

let settings = loadSettings("pongSettings", DEFAULT_SETTINGS);

const difficultyEl = document.getElementById("difficulty");
const winScoreEl = document.getElementById("winScore");
const soundEl = document.getElementById("sound");
const modeEl = document.getElementById("mode");
difficultyEl.value = settings.difficulty;
winScoreEl.value = String(settings.winScore);
soundEl.checked = settings.sound;

function persistSettings() {
  settings = {
    difficulty: difficultyEl.value,
    winScore: Number(winScoreEl.value),
    sound: soundEl.checked,
  };
  saveSettings("pongSettings", settings);
}

function applySettings(e) {
  persistSettings();
  e.target.blur(); // a focused <select> would eat the arrow keys
  newGame();
}
difficultyEl.addEventListener("change", applySettings);
winScoreEl.addEventListener("change", applySettings);

// Sound is presentation, not world — toggling it must not restart a rally.
soundEl.addEventListener("change", (e) => {
  persistSettings();
  e.target.blur();
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
// RENDER — clear and redraw the whole frame from state, every frame
// ----------------------------------------------------------------------------

// Colors come from the CSS palette — the canvas and the page share a theme.
const TEXT = cssVar("--text");
const ACCENT = cssVar("--accent");

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // The net: a dashed center line, drawn as one stroked path.
  ctx.strokeStyle = "rgba(230, 230, 230, 0.15)";
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scores live ON the court, like the original's segmented digits.
  ctx.fillStyle = "rgba(230, 230, 230, 0.35)";
  ctx.font = "bold 64px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(state.scores.left, canvas.width * 0.25, 80);
  ctx.fillText(state.scores.right, canvas.width * 0.75, 80);

  // Paddles. The core stores only each paddle's center y; the x positions
  // are derived from the same constants the physics uses.
  ctx.fillStyle = TEXT;
  drawPaddle(Pong.PADDLE.margin, state.paddles.left.y);
  drawPaddle(
    canvas.width - Pong.PADDLE.margin - Pong.PADDLE.width,
    state.paddles.right.y
  );

  // The ball — a square, faithful to 1972.
  const half = Pong.BALL.size / 2;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(
    state.ball.x - half,
    state.ball.y - half,
    Pong.BALL.size,
    Pong.BALL.size
  );

  if (paused) drawOverlay(ctx, "PAUSED", "Space to resume");
  if (state.status === "gameover") {
    const winner =
      state.scores.left > state.scores.right ? "YOU WIN" : "CPU WINS";
    drawOverlay(ctx, winner, "Enter to play again");
  }
}

function drawPaddle(x, centerY) {
  ctx.fillRect(
    x,
    centerY - Pong.PADDLE.height / 2,
    Pong.PADDLE.width,
    Pong.PADDLE.height
  );
}

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

function sound(event) {
  if (settings.sound && SOUNDS[event.type]) SOUNDS[event.type](event);
}

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
  render,
});
