// ============================================================================
// game.mjs — OXO, DECLARED on the turn engine. What remains here is only
// OXO's own: cell picking, the status line, and the machine's polite
// 300ms thinking pause (with live-state guards, so a restart mid-pause
// can't confuse it).
// ============================================================================

import * as Oxo from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";

const opponentEl = document.getElementById("opponent");

const vsCpu = () => game.session.settings.opponent === "cpu";
const cpuToMove = () =>
  vsCpu() && game.session.state.status === "playing" && game.session.state.turn === "O";

const game = createTurnGame({
  core: Oxo,
  render,
  options: () => ({}),
  settings: {
    storageKey: "oxoSettings",
    defaults: { opponent: "cpu" },
    read: () => ({ opponent: opponentEl.value }),
    write: (s) => {
      opponentEl.value = s.opponent;
    },
    worldEls: [opponentEl],
  },
  sounds: {
    placed: (e) => beep({ freq: e.mark === "X" ? 660 : 440, duration: 0.05, volume: 0.08 }),
    won: () => fanfare(),
    draw: () => {
      beep({ freq: 392, duration: 0.12, type: "triangle" });
      beep({ freq: 392, duration: 0.18, at: 0.14, type: "triangle" });
    },
  },
  hud: (state) => ({
    score:
      state.status === "won" ? `${state.winner} wins` :
      state.status === "draw" ? "a draw" :
      `${state.turn} to move`,
  }),
  touch: [
    { code: "Digit1", label: "1P" },
    { code: "Digit2", label: "2P" },
    { code: "Enter", label: "↻" },
  ],
  afterAct: () => {
    if (!cpuToMove()) return;
    setTimeout(() => {
      if (cpuToMove()) {
        game.act(Oxo.place(game.session.state, Oxo.aiMove(game.session.state)));
      }
    }, 300);
  },
});

// The start card: pick your opponent before the first move, the way the
// cabinet asks. 1 seats the machine, 2 a second human — the pick runs
// through the select's own change event, so the ordinary settings wiring
// persists it and deals a fresh board. A tap just begins with the saved
// mode. Shown once, at page load; after that the settings panel serves.
let choosing = true;
document.addEventListener("keydown", (e) => {
  if (!choosing) return;
  const pick = { Digit1: "cpu", Digit2: "human" }[e.code];
  if (!pick) return;
  choosing = false;
  opponentEl.value = pick;
  opponentEl.dispatchEvent(new Event("change"));
});
drawOverlay(
  game.canvas.getContext("2d"),
  "OXO",
  "1 · vs the machine   2 · two players   ·   tap to begin"
);

game.canvas.addEventListener("pointerdown", (e) => {
  if (choosing) {
    choosing = false; // begin with the saved mode — the card was the question
    game.draw();
    return;
  }
  if (cpuToMove()) return; // the machine is thinking
  const index = pickCell(game.canvas, e, { cols: 3, rows: 3, cell: game.canvas.width / 3 });
  if (index !== -1) game.act(Oxo.place(game.session.state, index));
});
