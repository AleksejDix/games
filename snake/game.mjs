// ============================================================================
// game.mjs — the IMPERATIVE SHELL
//
// Everything browser-specific lives here: canvas drawing, keyboard events,
// the frame clock, localStorage. It contains NO game rules — those are
// imported from logic.mjs, where `node --test` can reach them.
// If a rule ever sneaks into this file, it just became untestable.
//
// `import * as Snake` pulls in the module's whole public API under one
// namespace — the browser resolves this itself, no bundler involved.
// (This is also why the page needs a local server: browsers refuse to
// resolve module imports over file:// URLs.)
// ============================================================================

import * as Snake from "./logic.mjs";
import { beep, unlockAudio } from "../shared/audio.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const CELL = 20;                        // pixel size of one grid cell
const COLS = canvas.width / CELL;       // 21
const ROWS = canvas.height / CELL;      // 21

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

let state;
let paused = false; // pausing is presentation, not a game rule → lives here

// ----------------------------------------------------------------------------
// SETTINGS — pure shell territory: a form plus localStorage. The core never
// sees any of this machinery, only the resulting createState parameters.
// ----------------------------------------------------------------------------

const DEFAULT_SETTINGS = { wrap: true, stepMs: 130, sound: true };

function loadSettings() {
  // localStorage stores strings, so structs go through JSON. The try/catch
  // means a missing or corrupted entry silently becomes "use the defaults".
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.snakeSettings) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings = loadSettings();

const wrapEl = document.getElementById("wrap");
const speedEl = document.getElementById("speed");
const soundEl = document.getElementById("sound");
wrapEl.checked = settings.wrap;
speedEl.value = String(settings.stepMs);
soundEl.checked = settings.sound;

function saveSettings() {
  settings = {
    wrap: wrapEl.checked,
    stepMs: Number(speedEl.value),
    sound: soundEl.checked,
  };
  localStorage.snakeSettings = JSON.stringify(settings);
}

function applySettings(e) {
  saveSettings();
  // Give focus back to the page — a still-focused <select> would swallow
  // the arrow keys meant for the snake.
  e.target.blur();
  newGame(); // these settings define the world, so changing them starts fresh
}
wrapEl.addEventListener("change", applySettings);
speedEl.addEventListener("change", applySettings);

// Sound is different: it's presentation, not world — toggling it must NOT
// restart a running game.
soundEl.addEventListener("change", (e) => {
  saveSettings();
  e.target.blur();
});

function newGame() {
  state = Snake.createState({
    cols: COLS,
    rows: ROWS,
    wrap: settings.wrap,
    stepMs: settings.stepMs,
  });
  paused = false;
}

// ----------------------------------------------------------------------------
// INPUT — translate raw key events into logic calls, nothing more
// ----------------------------------------------------------------------------

// The first gesture of any kind unlocks audio (see shared/audio.mjs on
// why browsers demand this). { once: true } auto-removes the listeners.
document.addEventListener("keydown", unlockAudio, { once: true });
document.addEventListener("pointerdown", unlockAudio, { once: true });

const KEY_DIRS = {
  ArrowUp: "up",    KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

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

  const name = KEY_DIRS[e.code];
  if (name && state.status === "playing" && !paused) {
    e.preventDefault();
    Snake.queueDirection(state, Snake.DIRS[name]);
  }
});

// ----------------------------------------------------------------------------
// RENDER — draw the whole frame from scratch, every frame
// ----------------------------------------------------------------------------
// Games don't "move" drawn pixels: each frame you clear everything and
// redraw from state. State is the truth; the screen is just a projection.

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawCell(state.food.x, state.food.y, "#e7566e", 4);

  // The timed bonus: gold, and blinking during its last 10 ticks as an
  // expiry warning. ttl only changes per tick, so the blink runs at
  // simulation speed even though render runs every frame.
  if (state.bonus && (state.bonus.ttl > 10 || state.bonus.ttl % 2 === 0)) {
    drawCell(state.bonus.x, state.bonus.y, "#f5c542", 3);
  }

  // Snake: head brightest, body fading toward the tail.
  state.snake.forEach((seg, i) => {
    const t = i / state.snake.length; // 0 at head → 1 at tail
    const green = Math.round(231 - t * 120);
    drawCell(seg.x, seg.y, `rgb(80, ${green}, 80)`, 1);
  });

  scoreEl.textContent = state.score;

  if (paused) overlay("PAUSED", "Space to resume");
  if (state.status === "gameover") overlay("GAME OVER", "Enter to restart");
}

function drawCell(x, y, color, inset) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    x * CELL + inset,
    y * CELL + inset,
    CELL - inset * 2,
    CELL - inset * 2,
    4
  );
  ctx.fill();
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
// THE GAME LOOP — fixed-timestep update, free-running render
// ----------------------------------------------------------------------------
// requestAnimationFrame fires once per display refresh with a high-precision
// timestamp. We accumulate elapsed real time and run one simulation step per
// full stepMs slice inside it. This decouples "how often the world advances"
// from "how often the screen repaints" — so the snake moves at the same
// speed on a 60Hz laptop and a 144Hz monitor.

let lastTime = 0;
let accumulator = 0;

function frame(time) {
  const delta = time - lastTime;
  lastTime = time;

  if (state.status === "playing" && !paused) {
    // Clamp huge deltas (e.g. the tab was in the background) so we don't
    // fast-forward through dozens of ticks in one frame.
    accumulator += Math.min(delta, 250);
    while (accumulator >= state.stepMs) {
      const event = Snake.step(state);
      if (event === "died") saveBest();
      sound(event);
      accumulator -= state.stepMs;
    }
  }

  render();
  requestAnimationFrame(frame);
}

// ----------------------------------------------------------------------------
// SOUND — a lookup from step() events to bleeps. The core has no idea any
// of this exists; it just keeps reporting what happened.
// ----------------------------------------------------------------------------

const SOUNDS = {
  ate: () => beep({ freq: 880, duration: 0.06 }),
  ateBonus: () => {
    // A little two-note rising chirp — richer than one bleep, still cheap.
    beep({ freq: 660, duration: 0.06 });
    beep({ freq: 990, duration: 0.09, at: 0.07 });
  },
  died: () => beep({ freq: 220, slideTo: 55, duration: 0.45, type: "sawtooth" }),
};

function sound(event) {
  if (settings.sound && SOUNDS[event]) SOUNDS[event]();
  // "moved" has no entry on purpose — 8 ticks/second of bleeps is torture.
}

function saveBest() {
  const best = Math.max(state.score, Number(localStorage.snakeBest ?? 0));
  localStorage.snakeBest = best;
  bestEl.textContent = best;
}

newGame();
bestEl.textContent = localStorage.snakeBest ?? 0;
requestAnimationFrame(frame);
