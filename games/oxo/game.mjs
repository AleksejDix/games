// ============================================================================
// game.mjs — OXO, DECLARED on the turn engine. What remains here is only
// OXO's own: cell picking, the status line, and the machine's polite
// 300ms thinking pause (with live-state guards, so a restart mid-pause
// can't confuse it).
// ============================================================================

import * as Oxo from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";

const opponentEl = document.getElementById("opponent");
const soundEl = document.getElementById("sound");

const vsCpu = () => game.session.settings.opponent === "cpu";
const cpuToMove = () =>
  vsCpu() && game.session.state.status === "playing" && game.session.state.turn === "O";

const game = createTurnGame({
  core: Oxo,
  render,
  options: () => ({}),
  settings: {
    storageKey: "oxoSettings",
    defaults: { opponent: "cpu", sound: true },
    read: () => ({ opponent: opponentEl.value, sound: soundEl.checked }),
    write: (s) => {
      opponentEl.value = s.opponent;
      soundEl.checked = s.sound;
    },
    worldEls: [opponentEl],
    presentationEls: [soundEl],
  },
  sounds: {
    placed: (e) => beep({ freq: e.mark === "X" ? 660 : 440, duration: 0.05, volume: 0.08 }),
    won: () =>
      [523, 659, 784, 1047].forEach((freq, i) =>
        beep({ freq, duration: 0.14, at: i * 0.1, type: "triangle" })
      ),
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
  afterAct: () => {
    if (!cpuToMove()) return;
    setTimeout(() => {
      if (cpuToMove()) {
        game.act(Oxo.place(game.session.state, Oxo.aiMove(game.session.state)));
      }
    }, 300);
  },
});

game.canvas.addEventListener("pointerdown", (e) => {
  if (cpuToMove()) return; // the machine is thinking
  const p = pointerPosition(game.canvas, e);
  const cell = game.canvas.width / 3;
  game.act(Oxo.place(game.session.state, Math.floor(p.y / cell) * 3 + Math.floor(p.x / cell)));
});
