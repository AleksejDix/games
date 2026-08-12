// ============================================================================
// game.mjs — Breakout's IMPERATIVE SHELL
//
// Nothing conceptually new in this file — that's the point. Held keys came
// from Pong, the settings form and best-score storage from Snake, the
// audio unlock from shared/audio.mjs. A third game costs only its rules.
// ============================================================================

import * as Breakout from "./logic.mjs";
import { beep, unlockAudio } from "../shared/audio.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const livesEl = document.getElementById("lives");

let state;
let paused = false;

// ----------------------------------------------------------------------------
// SETTINGS
// ----------------------------------------------------------------------------

const PADDLE_SIZES = { wide: 100, classic: 70, narrow: 50 };

const DEFAULT_SETTINGS = { paddle: "classic", lives: 3, sound: true };

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.breakoutSettings) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings = loadSettings();

const paddleEl = document.getElementById("paddle");
const livesSelectEl = document.getElementById("startLives");
const soundEl = document.getElementById("sound");
paddleEl.value = settings.paddle;
livesSelectEl.value = String(settings.lives);
soundEl.checked = settings.sound;

function saveSettings() {
  settings = {
    paddle: paddleEl.value,
    lives: Number(livesSelectEl.value),
    sound: soundEl.checked,
  };
  localStorage.breakoutSettings = JSON.stringify(settings);
}

function applySettings(e) {
  saveSettings();
  e.target.blur();
  newGame();
}
paddleEl.addEventListener("change", applySettings);
livesSelectEl.addEventListener("change", applySettings);

// Presentation, not world — no restart.
soundEl.addEventListener("change", (e) => {
  saveSettings();
  e.target.blur();
});

function newGame() {
  state = Breakout.createState({
    lives: settings.lives,
    paddleWidth: PADDLE_SIZES[settings.paddle] ?? PADDLE_SIZES.classic,
  });
  paused = false;
}

// ----------------------------------------------------------------------------
// INPUT — held keys, like Pong
// ----------------------------------------------------------------------------

const held = new Set();

document.addEventListener("keydown", unlockAudio, { once: true });
document.addEventListener("pointerdown", unlockAudio, { once: true });

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (state.status === "playing") paused = !paused;
    return;
  }
  if (e.code === "Enter" && state.status !== "playing") {
    newGame();
    return;
  }
  if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code)) {
    e.preventDefault();
    held.add(e.code);
  }
});

document.addEventListener("keyup", (e) => held.delete(e.code));

function playerInput() {
  let dir = 0;
  if (held.has("ArrowLeft") || held.has("KeyA")) dir -= 1;
  if (held.has("ArrowRight") || held.has("KeyD")) dir += 1;
  return dir;
}

// ----------------------------------------------------------------------------
// RENDER
// ----------------------------------------------------------------------------

// One color per brick row, warm at the top where the points are.
const ROW_COLORS = ["#e7566e", "#e78a56", "#f5c542", "#6ee76e", "#56c8e7", "#9a7de7"];

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bricks: position from state, size from the shared constants, inset a
  // couple of pixels so the wall reads as bricks instead of a slab.
  for (const b of state.bricks) {
    ctx.fillStyle = ROW_COLORS[b.row % ROW_COLORS.length];
    ctx.fillRect(b.x + 2, b.y + 2, Breakout.BRICKS.width - 4, Breakout.BRICKS.height - 4);
  }

  // Paddle.
  ctx.fillStyle = "#e6e6e6";
  ctx.fillRect(
    state.paddle.x - state.paddle.width / 2,
    Breakout.PADDLE.y - Breakout.PADDLE.height / 2,
    state.paddle.width,
    Breakout.PADDLE.height
  );

  // Ball.
  const half = Breakout.BALL.size / 2;
  ctx.fillStyle = "#6ee76e";
  ctx.fillRect(state.ball.x - half, state.ball.y - half, Breakout.BALL.size, Breakout.BALL.size);

  scoreEl.textContent = state.score;
  livesEl.textContent = "♥".repeat(state.lives);

  if (paused) overlay("PAUSED", "Space to resume");
  if (state.status === "gameover") overlay("GAME OVER", "Enter to restart");
  if (state.status === "cleared") overlay("WALL CLEARED!", "Enter to play again");
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
// SOUND
// ----------------------------------------------------------------------------

const TOTAL_BRICKS = Breakout.BRICKS.cols * Breakout.BRICKS.rows;

const SOUNDS = {
  wall: () => beep({ freq: 220, duration: 0.05 }),
  paddle: () => beep({ freq: 440, duration: 0.05 }),
  // The wall crumbles in rising pitch: each destroyed brick bleeps a
  // little higher than the last. State drives the sound, like the pixels.
  brick: () =>
    beep({ freq: 500 + (TOTAL_BRICKS - state.bricks.length) * 10, duration: 0.06 }),
  lostBall: () => beep({ freq: 330, slideTo: 110, duration: 0.3, type: "triangle" }),
  died: () => beep({ freq: 220, slideTo: 55, duration: 0.45, type: "sawtooth" }),
  cleared: () =>
    [523, 659, 784, 1047].forEach((freq, i) =>
      beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
    ),
};

function sound(event) {
  if (settings.sound && SOUNDS[event]) SOUNDS[event]();
}

// ----------------------------------------------------------------------------
// THE GAME LOOP — the same 120Hz fixed-timestep accumulator as Pong
// ----------------------------------------------------------------------------

const STEP_MS = Breakout.DT * 1000;

let lastTime = 0;
let accumulator = 0;

function frame(time) {
  const delta = time - lastTime;
  lastTime = time;

  if (state.status === "playing" && !paused) {
    accumulator += Math.min(delta, 250);
    while (accumulator >= STEP_MS) {
      const event = Breakout.step(state, playerInput());
      if (event === "died" || event === "cleared") saveBest();
      sound(event);
      accumulator -= STEP_MS;
    }
  }

  render();
  requestAnimationFrame(frame);
}

function saveBest() {
  const best = Math.max(state.score, Number(localStorage.breakoutBest ?? 0));
  localStorage.breakoutBest = best;
  bestEl.textContent = best;
}

newGame();
bestEl.textContent = localStorage.breakoutBest ?? 0;
requestAnimationFrame(frame);
