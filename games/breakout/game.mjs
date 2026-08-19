// ============================================================================
// game.mjs — Breakout, DECLARED on the engine.
// The serving state shows two engine hooks earning their keep: a special
// key (Space launches instead of pausing while serving) and an extra
// running status (the loop simulates the aiming phase too).
// ============================================================================

import * as Breakout from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { trackHeldKeys, axis } from "../../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowLeft", "ArrowRight", "KeyA", "KeyD");

const PADDLE_SIZES = { wide: 100, classic: 70, narrow: 50 };
const TOTAL_BRICKS = Breakout.BRICKS.cols * Breakout.BRICKS.rows;

const paddleEl = document.getElementById("paddle");
const livesSelectEl = document.getElementById("startLives");
const soundEl = document.getElementById("sound");

createGame({
  core: Breakout,
  render,

  options: (s) => ({
    lives: s.lives,
    paddleWidth: PADDLE_SIZES[s.paddle] ?? PADDLE_SIZES.classic,
  }),

  settings: {
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
  },

  input: () => axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
  runningStatuses: ["playing", "serving"], // aiming is simulated too

  // Space is contextual: launch while serving, otherwise the engine's
  // default pause handling takes it.
  special: (e, api) => {
    if (e.code === "Space" && api.state.status === "serving") {
      e.preventDefault();
      api.dispatch(Breakout.launch(api.state));
      return true;
    }
    return false;
  },

  sounds: {
    launched: () => beep({ freq: 660, duration: 0.05 }),
    wall: () => beep({ freq: 220, duration: 0.05 }),
    paddle: () => beep({ freq: 440, duration: 0.05 }),
    // The wall crumbles in rising pitch — count from the event payload.
    brick: (e) =>
      beep({ freq: 500 + (TOTAL_BRICKS - e.remaining) * 10, duration: 0.06 }),
    lostBall: () => beep({ freq: 330, slideTo: 110, duration: 0.3, type: "triangle" }),
    died: () => beep({ freq: 220, slideTo: 55, duration: 0.45, type: "sawtooth" }),
    cleared: () =>
      [523, 659, 784, 1047].forEach((freq, i) =>
        beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
      ),
  },

  best: { key: "breakoutBest", on: ["died", "cleared"] },
  hud: (state) => ({ score: state.score, lives: "♥".repeat(state.lives) }),
});

// Thumb layout for phones — on-screen buttons that synthesize these keys.
touchControls([
  { code: "ArrowLeft", label: "◀" },
  { code: "Space", label: "●" }, // launch — the contextual Space rides along
  { code: "ArrowRight", label: "▶" },
  { code: "Enter", label: "↻" },
]);
