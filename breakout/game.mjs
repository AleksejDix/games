// ============================================================================
// game.mjs — Breakout's IMPERATIVE SHELL
//
// The shell that shows the refactor's payoff: with the shared mechanisms
// (loop, settings, held keys, overlay, audio unlock) imported, what's left
// is purely Breakout — its bricks, its hearts, its crumbling-wall pitch.
// ============================================================================

import * as Breakout from "./logic.mjs";
import { render } from "./render.mjs";
import { beep, unlockOnFirstGesture, soundBoard } from "../shared/audio.mjs";
import { bindSettings } from "../shared/settings.mjs";
import { startLoop } from "../shared/loop.mjs";
import { trackHeldKeys, axis } from "../shared/input.mjs";
import { trackBest } from "../shared/score.mjs";

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

const paddleEl = document.getElementById("paddle");
const livesSelectEl = document.getElementById("startLives");
const soundEl = document.getElementById("sound");

const settings = bindSettings({
  storageKey: "breakoutSettings",
  defaults: { paddle: "classic", lives: 3, sound: true },
  read: () => ({
    paddle: paddleEl.value,
    lives: Number(livesSelectEl.value),
    sound: soundEl.checked,
  }),
  write: (s) => {
    paddleEl.value = s.paddle;
    livesSelectEl.value = String(s.lives);
    soundEl.checked = s.sound;
  },
  worldEls: [paddleEl, livesSelectEl],
  presentationEls: [soundEl],
  onWorldChange: () => newGame(),
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
    // Space is contextual: it fires the serve, or pauses a live rally.
    if (state.status === "serving") dispatch(Breakout.launch(state));
    else if (state.status === "playing") paused = !paused;
  }
  // Enter restarts from either ending — gameover or cleared.
  if (e.code === "Enter" && (state.status === "gameover" || state.status === "cleared")) {
    newGame();
  }
});

// ----------------------------------------------------------------------------
// SOUND
// ----------------------------------------------------------------------------

const TOTAL_BRICKS = Breakout.BRICKS.cols * Breakout.BRICKS.rows;

const SOUNDS = {
  launched: () => beep({ freq: 660, duration: 0.05 }),
  wall: () => beep({ freq: 220, duration: 0.05 }),
  paddle: () => beep({ freq: 440, duration: 0.05 }),
  // The wall crumbles in rising pitch. The event's payload says how many
  // bricks remain — no more digging through state to guess what happened.
  brick: (e) =>
    beep({ freq: 500 + (TOTAL_BRICKS - e.remaining) * 10, duration: 0.06 }),
  lostBall: () => beep({ freq: 330, slideTo: 110, duration: 0.3, type: "triangle" }),
  died: () => beep({ freq: 220, slideTo: 55, duration: 0.45, type: "sawtooth" }),
  cleared: () =>
    [523, 659, 784, 1047].forEach((freq, i) =>
      beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
    ),
};

const sound = soundBoard(SOUNDS, () => settings.sound);

// One funnel for events from ANY action — step() in the loop, launch()
// from the key handler. Every event goes through the same reactions.
function dispatch(events) {
  for (const event of events) {
    if (event.type === "died" || event.type === "cleared") saveBest(state.score);
    sound(event);
  }
}

// ----------------------------------------------------------------------------
// WIRE IT UP
// ----------------------------------------------------------------------------

const STEP_MS = Breakout.DT * 1000;

const saveBest = trackBest("breakoutBest", bestEl);

newGame();

startLoop({
  stepMs: () => STEP_MS,
  // The loop also runs while serving — that's how you aim the glued ball.
  running: () =>
    (state.status === "playing" || state.status === "serving") && !paused,
  update: () => dispatch(Breakout.step(state, playerInput())),
  render: () => {
    render(ctx, state, paused);
    // The header readouts ride along with the frame.
    scoreEl.textContent = state.score;
    livesEl.textContent = "♥".repeat(state.lives);
  },
});
