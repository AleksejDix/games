// ============================================================================
// game.mjs — Whac-a-Mole, DECLARED on the clocked engine. The mallet is
// the pointer, dispatched through the api like Missile Command's clicks.
// ============================================================================

import * as Whac from "./logic.mjs";
import { render, holeGeometry } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { startCard } from "../../shared/startcard.mjs";

// Declared before the engine boots — the first newGame fires inside
// createGame and onNewGame reaches for the card.
let card = null;

const canvas = document.getElementById("game");
const paceEl = document.getElementById("pace");

const PACE = { calm: 0.8, classic: 1.2, frantic: 1.9 };

const api = createGame({
  core: Whac,
  render,
  options: (s) => ({ rate: PACE[s.pace] ?? PACE.classic }),
  settings: {
    storageKey: "whacSettings",
    defaults: { pace: "classic" },
    read: () => ({ pace: paceEl.value }),
    write: (s) => {
      paceEl.value = s.pace;
    },
    worldEls: [paceEl],
  },
  sounds: {
    popped: () => beep({ freq: 300, slideTo: 480, duration: 0.07, volume: 0.07 }),
    whacked: () => {
      beep({ freq: 110, duration: 0.05, volume: 0.12 });
      beep({ freq: 660, duration: 0.06, at: 0.05 });
    },
    whiffed: () => beep({ freq: 90, duration: 0.08, volume: 0.07 }),
    timeUp: () => beep({ freq: 392, slideTo: 130, duration: 0.7, type: "triangle" }),
  },
  best: "whacBest",
  hud: (state) => ({ score: state.score }),
  // Every fresh lawn lands on ready — the card asks again (the carnival
  // wants its coin-drop moment before each thirty seconds).
  onNewGame: () => card?.show(),
});

// Whac is the one solo game with a START button: its clock has no
// natural first input — a whack before any mole would just be a whiff.
card = startCard({
  title: "WHAC-A-MOLE",
  options: [{ label: "start the thirty seconds", value: true }],
  onPick: () => api.dispatch(Whac.start(api.state)),
});
card.show();

canvas.addEventListener("pointerdown", (e) => {
  if (api.paused) return; // no whacking frozen moles — pause froze the clock, not the score
  const index = pickCell(canvas, e, { cols: 3, rows: 3, ...holeGeometry(canvas) });
  if (index !== -1) api.dispatch(Whac.whack(api.state, index));
});

touchControls([{ code: "Enter", label: "↻" }]);
