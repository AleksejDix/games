// ============================================================================
// game.mjs — Breakout, DECLARED on the engine.
// The serving state shows two engine hooks earning their keep: a special
// key (Space launches instead of pausing while serving) and an extra
// running status (the loop simulates the aiming phase too).
// ============================================================================

import * as Breakout from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { trackHeldKeys, axis, actionKeys, pointerPosition } from "../../shared/input.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowLeft", "ArrowRight", "KeyA", "KeyD");

// The finger is the knob: while a pointer rides the court, input() asks
// for POSITION and the paddle parks under it — no chase, no lag, the
// 1976 potentiometer feel. Whole court units, so the replay log stays
// lean. A quick tap serves (checked against live state on release, so a
// mid-rally jab never reaches the pause key).
const canvas = document.getElementById("game");
canvas.style.touchAction = "none"; // steering must never scroll
let finger = null;
let downAt = 0;
canvas.addEventListener("pointerdown", (e) => {
  finger = Math.round(pointerPosition(canvas, e).x);
  downAt = performance.now();
});
canvas.addEventListener("pointermove", (e) => {
  if (finger !== null) finger = Math.round(pointerPosition(canvas, e).x);
});
const release = (e) => {
  if (finger === null) return;
  finger = null;
  if (
    e.type === "pointerup" &&
    performance.now() - downAt < 180 &&
    api.state.status === "serving"
  ) {
    // Tap serves — as a synthesized Space, so the launch walks the same
    // recorded actionKeys door the keyboard uses (and the replay sees it).
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
    document.dispatchEvent(new KeyboardEvent("keyup", { code: "Space" }));
  }
};
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

const PADDLE_SIZES = { wide: 100, classic: 70, narrow: 50 };
const TOTAL_BRICKS = Breakout.BRICKS.cols * Breakout.BRICKS.rows;


const api = createGame({
  core: Breakout,
  render,

  options: (s) => ({
    lives: s.startLives,
    paddleWidth: PADDLE_SIZES[s.paddle] ?? PADDLE_SIZES.classic,
  }),

  settings: {
    controls: { paddle: "classic", startLives: 3 },
  },

  input: () =>
    finger !== null ? { to: finger } : axis(held, ["ArrowLeft", "KeyA"], ["ArrowRight", "KeyD"]),
  runningStatuses: ["playing", "serving"], // aiming is simulated too

  // Space is contextual: launch while serving, otherwise the refusal
  // falls through to the engine's default pause handling.
  special: actionKeys(
    { Space: (s) => Breakout.launch(s) },
    { when: (s) => s.status === "serving" }
  ),

  sounds: {
    launched: () => beep({ freq: 660, duration: 0.05 }),
    wall: () => beep({ freq: 220, duration: 0.05 }),
    paddle: () => beep({ freq: 440, duration: 0.05 }),
    // The wall crumbles in rising pitch — count from the event payload.
    brick: (e) =>
      beep({ freq: 500 + (TOTAL_BRICKS - e.remaining) * 10, duration: 0.06 }),
    lostBall: () => beep({ freq: 330, slideTo: 110, duration: 0.3, type: "triangle" }),
    died: () => beep({ freq: 220, slideTo: 55, duration: 0.45, type: "sawtooth" }),
    cleared: () => fanfare(),
  },

  best: true,
  hud: (state) => ({ score: state.score, lives: "♥".repeat(state.lives) }),
});

touchControls([]);
