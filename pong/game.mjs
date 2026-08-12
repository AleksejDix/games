// ============================================================================
// game.mjs — Pong's IMPERATIVE SHELL
//
// Same division of labor as Snake: everything browser-specific (canvas,
// keyboard, the frame clock) lives here; every rule lives in logic.mjs
// where `node --test` can reach it.
//
// One new idea in this shell: HELD keys. Snake queued key PRESSES (discrete
// taps). A Pong paddle moves for as long as a key is DOWN, so we track the
// set of currently-held keys via keydown/keyup and sample it every tick.
// ============================================================================

import * as Pong from "./logic.mjs";
import { beep, unlockAudio } from "../shared/audio.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
// Canvas pixels map 1:1 onto court units (800×500), so no scaling math —
// the core's coordinates ARE screen coordinates here.

let state;
let paused = false; // presentation concern, same as in Snake

// ----------------------------------------------------------------------------
// SETTINGS — same shell pattern as Snake: form + localStorage → createState
// parameters. Difficulty NAMES are shell vocabulary; the core only ever
// sees the numbers they stand for.
// ----------------------------------------------------------------------------

const DIFFICULTY = {
  easy: { speed: 0.5, deadZone: 30 },   // half-speed stick, sloppy tracking
  normal: { speed: 0.8, deadZone: 12 },
  hard: { speed: 1, deadZone: 4 },      // full chase — beat it with angles
};

const DEFAULT_SETTINGS = { difficulty: "normal", winScore: 11, sound: true };

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.pongSettings) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings = loadSettings();

const difficultyEl = document.getElementById("difficulty");
const winScoreEl = document.getElementById("winScore");
const soundEl = document.getElementById("sound");
const modeEl = document.getElementById("mode");
difficultyEl.value = settings.difficulty;
winScoreEl.value = String(settings.winScore);
soundEl.checked = settings.sound;

function saveSettings() {
  settings = {
    difficulty: difficultyEl.value,
    winScore: Number(winScoreEl.value),
    sound: soundEl.checked,
  };
  localStorage.pongSettings = JSON.stringify(settings);
}

function applySettings(e) {
  saveSettings();
  e.target.blur(); // a focused <select> would eat the arrow keys
  newGame();
}
difficultyEl.addEventListener("change", applySettings);
winScoreEl.addEventListener("change", applySettings);

// Sound is presentation, not world — toggling it must not restart a rally.
soundEl.addEventListener("change", (e) => {
  saveSettings();
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
// INPUT — a Set of held keys, sampled once per simulation tick
// ----------------------------------------------------------------------------

const held = new Set();

// Any first gesture unlocks audio (see shared/audio.mjs for the why).
document.addEventListener("keydown", unlockAudio, { once: true });
document.addEventListener("pointerdown", unlockAudio, { once: true });

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (state.status === "playing") paused = !paused;
    return;
  }
  if (e.code === "Enter" && state.status === "gameover") {
    newGame();
    return;
  }
  if (["ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(e.code)) {
    e.preventDefault(); // arrows would scroll the page otherwise
    held.add(e.code);
  }
});

document.addEventListener("keyup", (e) => held.delete(e.code));

// Collapse the held keys into the -1|0|1 the core expects. Holding both
// directions at once cancels out to 0 — which falls out of the arithmetic.
function playerInput() {
  let dir = 0;
  if (held.has("ArrowUp") || held.has("KeyW")) dir -= 1;
  if (held.has("ArrowDown") || held.has("KeyS")) dir += 1;
  return dir;
}

// ----------------------------------------------------------------------------
// RENDER — clear and redraw the whole frame from state, every frame
// ----------------------------------------------------------------------------

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
  ctx.fillStyle = "#e6e6e6";
  drawPaddle(Pong.PADDLE.margin, state.paddles.left.y);
  drawPaddle(
    canvas.width - Pong.PADDLE.margin - Pong.PADDLE.width,
    state.paddles.right.y
  );

  // The ball — a square, faithful to 1972.
  const half = Pong.BALL.size / 2;
  ctx.fillStyle = "#6ee76e";
  ctx.fillRect(
    state.ball.x - half,
    state.ball.y - half,
    Pong.BALL.size,
    Pong.BALL.size
  );

  if (paused) overlay("PAUSED", "Space to resume");
  if (state.status === "gameover") {
    const winner =
      state.scores.left > state.scores.right ? "YOU WIN" : "CPU WINS";
    overlay(winner, "Enter to play again");
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

function overlay(title, subtitle) {
  ctx.fillStyle = "rgba(15, 17, 21, 0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e6e6e6";
  ctx.textAlign = "center";
  ctx.font = "bold 28px ui-monospace, monospace";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 8);
  ctx.font = "14px ui-monospace, monospace";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 20);
}

// ----------------------------------------------------------------------------
// THE GAME LOOP — same fixed-timestep accumulator as Snake, faster ticks
// ----------------------------------------------------------------------------
// Snake stepped every ~130ms (its speed WAS the tick rate). Pong's physics
// ticks 120 times a second — usually more often than the screen repaints,
// so several steps can run per frame. The accumulator pattern handles both
// extremes with the same code.

const STEP_MS = Pong.DT * 1000;

let lastTime = 0;
let accumulator = 0;

function frame(time) {
  const delta = time - lastTime;
  lastTime = time;

  if (state.status === "playing" && !paused) {
    accumulator += Math.min(delta, 250); // clamp background-tab jumps
    while (accumulator >= STEP_MS) {
      // The human drives the left paddle; the core's own aiInput() drives
      // the right one. Same signal, different source.
      const event = Pong.step(state, {
        left: playerInput(),
        right: Pong.aiInput(state, "right"),
      });
      sound(event);
      accumulator -= STEP_MS;
    }
  }

  render();
  requestAnimationFrame(frame);
}

// ----------------------------------------------------------------------------
// SOUND — step() events mapped to bleeps. Wall and paddle sit a musical
// octave apart (220/440 Hz), just like the original cabinet's two thunks.
// ----------------------------------------------------------------------------

const SOUNDS = {
  wall: () => beep({ freq: 220, duration: 0.05 }),
  paddle: () => beep({ freq: 440, duration: 0.05 }),
  scored: () => beep({ freq: 330, slideTo: 165, duration: 0.25, type: "triangle" }),
};

// Three-note jingles for the end of a match: the same melody up or down.
function jingle(freqs) {
  freqs.forEach((freq, i) =>
    beep({ freq, duration: 0.14, at: i * 0.11, type: "triangle" })
  );
}

function sound(event) {
  if (!settings.sound || !event) return;
  if (event === "scored" && state.status === "gameover") {
    // The point that ends the match gets the fanfare, not the plain bloop.
    const won = state.scores.left > state.scores.right;
    jingle(won ? [523, 659, 784] : [392, 311, 262]);
    return;
  }
  SOUNDS[event]?.();
}

newGame();
requestAnimationFrame(frame);
