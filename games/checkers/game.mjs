// ============================================================================
// game.mjs — Checkers, DECLARED on the turn engine. Two-click play like
// Peg: pick a piece up, put it on a glowing square. What remains here is
// only Checkers' own: the picking, the chain's auto-hold, and the
// machine's thinking pauses (OXO's guards, so a restart mid-pause can't
// confuse it).
// ============================================================================

import * as Checkers from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { startCard } from "../../shared/startcard.mjs";

const opponentEl = document.getElementById("opponent");

const vsCpu = () => game.session.settings.opponent === "cpu";
const cpuToMove = () =>
  vsCpu() && game.session.state.status === "playing" && game.session.state.turn === "white";

// The machine takes its turn after a beat — and keeps taking it through
// a chain, one visible jump at a time. Live-state guards throughout.
function cpuTurn() {
  setTimeout(() => {
    if (!cpuToMove()) return;
    const m = Checkers.botMove(game.session.state);
    if (m) game.act(Checkers.move(game.session.state, m.from, m.to));
    if (cpuToMove()) cpuTurn(); // still white: a chain continues
  }, 400);
}

const game = createTurnGame({
  core: Checkers,
  render,
  options: () => ({}),
  settings: {
    storageKey: "checkersSettings",
    defaults: { opponent: "cpu" },
    read: () => ({ opponent: opponentEl.value }),
    write: (s) => {
      opponentEl.value = s.opponent;
    },
    worldEls: [opponentEl],
  },
  sounds: {
    moved: () => beep({ freq: 300, duration: 0.04, volume: 0.07 }),
    captured: () => beep({ freq: 180, slideTo: 120, duration: 0.12, volume: 0.1 }),
    crowned: () => {
      beep({ freq: 660, duration: 0.08 });
      beep({ freq: 990, duration: 0.12, at: 0.09 });
    },
    won: () => fanfare(),
  },
  hud: (state) => {
    const count = (side) => state.cells.filter((p) => p?.side === side).length;
    return {
      score:
        state.status === "won"
          ? `${state.winner} wins`
          : `${state.turn === "red" ? "▶" : ""}red ${count("red")} · ` +
            `${state.turn === "white" ? "▶" : ""}white ${count("white")}`,
    };
  },
  afterAct: () => {
    // A chain locks the hand to the jumping piece; otherwise it empties.
    game.session.state.selected = game.session.state.chained;
    if (cpuToMove()) cpuTurn();
  },
});

game.session.onReset(() => (game.session.state.selected = null));
game.session.state.selected = null; // cosmetic: the piece in hand (render reads it)

// The start card: pick your opponent before the first move.
startCard({
  title: "CHECKERS",
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
  const state = game.session.state;
  if (state.status !== "playing" || cpuToMove()) return;
  const index = pickCell(game.canvas, e, boardGeometry(game.canvas, Checkers.SIZE));
  if (index === -1) return;

  const piece = state.cells[index];
  if (state.chained === null && piece && piece.side === state.turn) {
    // Pick up / put down — the render glows the hand and its landings.
    state.selected = state.selected === index ? null : index;
    game.draw();
  } else if (state.selected !== null && state.selected !== undefined) {
    game.act(Checkers.move(state, state.selected, index));
  }
});
