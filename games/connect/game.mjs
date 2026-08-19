// ============================================================================
// game.mjs — Connect Four, DECLARED on the turn engine. What remains
// here is only Connect Four's own: mapping a click to a COLUMN (any
// cell in it — gravity picks the row), and the machine's thinking
// pause (Checkers' guards, so a restart mid-pause can't confuse it).
// ============================================================================

import * as Connect from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { startCard } from "../../shared/startcard.mjs";

const opponentEl = document.getElementById("opponent");

const vsCpu = () => game.session.settings.opponent === "cpu";
const cpuToMove = () =>
  vsCpu() && game.session.state.status === "playing" && game.session.state.turn === "gold";

// The machine takes its turn after a beat. Live-state guards throughout.
function cpuTurn() {
  setTimeout(() => {
    if (!cpuToMove()) return;
    game.act(Connect.drop(game.session.state, Connect.botMove(game.session.state)));
  }, 400);
}

const game = createTurnGame({
  core: Connect,
  render,
  options: () => ({}),
  settings: {
    storageKey: "connectSettings",
    defaults: { opponent: "cpu" },
    read: () => ({ opponent: opponentEl.value }),
    write: (s) => {
      opponentEl.value = s.opponent;
    },
    worldEls: [opponentEl],
  },
  sounds: {
    // The landing thunk, pitched by how far the disc fell: a long drop
    // to the floor lands lower than a disc topping off a stack.
    dropped: (e) =>
      beep({ freq: 460 - Math.floor(e.index / Connect.COLS) * 36, duration: 0.05, volume: 0.08 }),
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
      `${state.turn === "red" ? "▶" : ""}red · ${state.turn === "gold" ? "▶" : ""}gold`,
  }),
  afterAct: () => {
    if (cpuToMove()) cpuTurn();
  },
});

// The start card: pick your opponent before the first drop. The pick
// runs through the select's own change event (persist + fresh board).
startCard({
  title: "CONNECT FOUR",
  options: [
    { label: "vs the machine", value: "cpu" },
    { label: "two players", value: "human" },
  ],
  onPick: (opponent) => {
    opponentEl.value = opponent;
    opponentEl.dispatchEvent(new Event("change"));
  },
}).show();

game.canvas.addEventListener("pointerdown", (e) => {
  if (cpuToMove()) return; // the machine is thinking
  const index = pickCell(
    game.canvas,
    e,
    boardGeometry(game.canvas, Connect.COLS, Connect.ROWS)
  );
  if (index === -1) return;
  // Any cell in a column means that COLUMN — gravity does the aiming.
  game.act(Connect.drop(game.session.state, index % Connect.COLS));
});
