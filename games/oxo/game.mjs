// ============================================================================
// game.mjs — OXO, on a bare session (turn-based: no clock, no pause).
// The machine answers after a polite beat — perfection needn't be smug.
// ============================================================================

import * as Oxo from "./logic.mjs";
import { render } from "./render.mjs";
import { createSession } from "../../shared/session.mjs";
import { beep } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";
import { touchControls } from "../../shared/touch.mjs";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("score");

const opponentEl = document.getElementById("opponent");
const soundEl = document.getElementById("sound");

const session = createSession({
  core: Oxo,
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
});

const vsCpu = () => session.settings.opponent === "cpu";

function draw() {
  render(ctx, session.state, false);
  const s = session.state;
  statusEl.textContent =
    s.status === "won" ? `${s.winner} wins` :
    s.status === "draw" ? "a draw" :
    `${s.turn} to move`;
}

function act(events) {
  session.dispatch(events);
  draw();
  // The machine's reply, a beat later. Guards re-check the LIVE state so
  // a restart during the pause can't confuse it.
  if (vsCpu() && session.state.status === "playing" && session.state.turn === "O") {
    setTimeout(() => {
      if (vsCpu() && session.state.status === "playing" && session.state.turn === "O") {
        act(Oxo.place(session.state, Oxo.aiMove(session.state)));
      }
    }, 300);
  }
}

canvas.addEventListener("pointerdown", (e) => {
  if (vsCpu() && session.state.turn === "O") return; // the machine is thinking
  const p = pointerPosition(canvas, e);
  const cell = canvas.width / 3;
  const index = Math.floor(p.y / cell) * 3 + Math.floor(p.x / cell);
  act(Oxo.place(session.state, index));
});

session.onReset(draw);
touchControls([{ code: "Enter", label: "↻" }]);
draw();
