// ============================================================================
// game.mjs — Pong, DECLARED on the engine.
// ============================================================================

import * as Pong from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { trackHeldKeys, axis, pointerPosition } from "../../shared/input.mjs";
import { startCard } from "../../shared/startcard.mjs";

// The game owns its input DEVICE; the engine only ever asks input(state).
const held = trackHeldKeys("ArrowUp", "ArrowDown", "KeyW", "KeyS");

// The finger is the knob (Breakout's potentiometer dialect, twice over):
// a pointer riding the court parks its paddle at the finger's height —
// no chase, no lag. In versus, each half of the court owns its paddle,
// and ownership sticks to the STARTING half, so a rally's drift across
// the midline never swaps seats. Solo, any finger drives the human
// paddle. Serving stays the start card's job, which thumbs already tap.
const canvas = document.getElementById("game");
canvas.style.touchAction = "none"; // steering must never scroll
const fingers = new Map(); // pointerId → { side, y }

canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosition(canvas, e);
  const side =
    api.settings.opponent === "human" && p.x >= Pong.COURT.width / 2 ? "right" : "left";
  fingers.set(e.pointerId, { side, y: Math.round(p.y) });
});
canvas.addEventListener("pointermove", (e) => {
  const finger = fingers.get(e.pointerId);
  if (finger) finger.y = Math.round(pointerPosition(canvas, e).y);
});
const release = (e) => fingers.delete(e.pointerId);
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

const fingerOn = (side) => {
  for (const finger of fingers.values()) if (finger.side === side) return finger;
  return null;
};

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

// The start card is built BEFORE the engine so onNewGame (which fires
// during createGame) can show it plainly. onPick only touches the api
// when clicked — long after both exist.
const card = startCard({
  title: "PONG",
  options: [
    { label: "vs cpu", value: "cpu" },
    { label: "two players", value: "human" },
  ],
  onPick: (opponent) => {
    opponentEl.value = opponent;
    opponentEl.dispatchEvent(new Event("change")); // → newGame → card.show()
    api.dispatch(Pong.start(api.state));
    card.hide();
  },
});

const api = createGame({
  core: Pong,
  render,

  options: (s) => ({
    winScore: s.winScore,
    ai: DIFFICULTY[s.difficulty] ?? DIFFICULTY.normal,
  }),

  settings: {
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
  // right — or a finger on each half of the court, knob dialect. Solo
  // keeps both key sets (and any finger) on the human's paddle.
  input: (state) => {
    const leftFinger = fingerOn("left");
    const rightFinger = fingerOn("right");
    return api.settings.opponent === "human"
      ? {
          left: leftFinger ? { to: leftFinger.y } : axis(held, ["KeyW"], ["KeyS"]),
          right: rightFinger ? { to: rightFinger.y } : axis(held, ["ArrowUp"], ["ArrowDown"]),
        }
      : {
          left: leftFinger
            ? { to: leftFinger.y }
            : axis(held, ["ArrowUp", "KeyW"], ["ArrowDown", "KeyS"]),
          right: Pong.botInput(state, "right"),
        };
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

  onNewGame: (state, s) => {
    modeEl.textContent =
      s.opponent === "human"
        ? `W/S vs. arrows · first to ${s.winScore}`
        : `you vs. cpu · ${s.difficulty} · first to ${s.winScore}`;
    // Every fresh court lands on ready — the card asks again, the
    // arcade loop (gameover, Enter, back to the start screen).
    card.show();
  },
});

// Fingers steer directly now (each half of the court its own paddle),
// so the thumb bar keeps only the restart it always appends.
touchControls([]);
