// ============================================================================
// game.mjs — Breakout's IMPERATIVE SHELL
//
// The shell that shows the refactor's payoff: with the shared mechanisms
// (loop, settings, held keys, overlay, audio unlock) imported, what's left
// is purely Breakout — its bricks, its hearts, its crumbling-wall pitch.
// ============================================================================

import * as Breakout from "./logic.mjs";
import { beep, unlockOnFirstGesture } from "../shared/audio.mjs";
import { loadSettings, saveSettings } from "../shared/settings.mjs";
import { startLoop } from "../shared/loop.mjs";
import { trackHeldKeys, axis } from "../shared/input.mjs";
import { drawOverlay } from "../shared/overlay.mjs";

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

let settings = loadSettings("breakoutSettings", DEFAULT_SETTINGS);

const paddleEl = document.getElementById("paddle");
const livesSelectEl = document.getElementById("startLives");
const soundEl = document.getElementById("sound");
paddleEl.value = settings.paddle;
livesSelectEl.value = String(settings.lives);
soundEl.checked = settings.sound;

function persistSettings() {
  settings = {
    paddle: paddleEl.value,
    lives: Number(livesSelectEl.value),
    sound: soundEl.checked,
  };
  saveSettings("breakoutSettings", settings);
}

function applySettings(e) {
  persistSettings();
  e.target.blur();
  newGame();
}
paddleEl.addEventListener("change", applySettings);
livesSelectEl.addEventListener("change", applySettings);

// Presentation, not world — no restart.
soundEl.addEventListener("change", (e) => {
  persistSettings();
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
// INPUT
// ----------------------------------------------------------------------------

unlockOnFirstGesture();

const held = trackHeldKeys("ArrowLeft", "ArrowRight", "KeyA", "KeyD");

const playerInput = () => axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (state.status === "playing") paused = !paused;
  }
  // Enter restarts from either ending — gameover or cleared.
  if (e.code === "Enter" && state.status !== "playing") newGame();
});

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

  if (paused) drawOverlay(ctx, "PAUSED", "Space to resume");
  if (state.status === "gameover") drawOverlay(ctx, "GAME OVER", "Enter to restart");
  if (state.status === "cleared") drawOverlay(ctx, "WALL CLEARED!", "Enter to play again");
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
// WIRE IT UP
// ----------------------------------------------------------------------------

const STEP_MS = Breakout.DT * 1000;

function saveBest() {
  const best = Math.max(state.score, Number(localStorage.breakoutBest ?? 0));
  localStorage.breakoutBest = best;
  bestEl.textContent = best;
}

newGame();
bestEl.textContent = localStorage.breakoutBest ?? 0;

startLoop({
  stepMs: () => STEP_MS,
  running: () => state.status === "playing" && !paused,
  update: () => {
    const event = Breakout.step(state, playerInput());
    if (event === "died" || event === "cleared") saveBest();
    sound(event);
  },
  render,
});
