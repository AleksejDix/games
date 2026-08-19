// ============================================================================
// game.mjs — Chess, DECLARED on the turn engine. Checkers' shell with a
// deeper core behind it: two-click play, a start card, and the machine
// thinking on a guarded pause. Pawns promote to queens here — the core
// knows all four crowns, the shell keeps the common case frictionless.
// ============================================================================

import * as Chess from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { startCard } from "../../shared/startcard.mjs";

const opponentEl = document.getElementById("opponent");

const vsCpu = () => game.session.settings.opponent === "cpu";
const cpuToMove = () =>
  vsCpu() && game.session.state.status === "playing" && game.session.state.turn === "black";

// The machine thinks for a beat, then plays. Live-state guards, so a
// restart mid-thought changes nothing it shouldn't.
function cpuTurn() {
  setTimeout(() => {
    if (!cpuToMove()) return;
    const m = Chess.botMove(game.session.state);
    if (m) game.act(Chess.move(game.session.state, m.from, m.to, m.promo));
  }, 450);
}

const game = createTurnGame({
  core: Chess,
  render,
  options: () => ({}),
  settings: {
    storageKey: "chessSettings",
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
    castled: () => {
      beep({ freq: 300, duration: 0.05, volume: 0.08 });
      beep({ freq: 400, duration: 0.05, at: 0.06, volume: 0.08 });
    },
    promoted: () => beep({ freq: 660, slideTo: 990, duration: 0.15, volume: 0.09 }),
    check: () => beep({ freq: 550, duration: 0.1, type: "triangle", volume: 0.1 }),
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
      `${state.turn} to move${Chess.inCheck(state, state.turn) ? " · check!" : ""}`,
  }),
  afterAct: () => {
    game.session.state.selected = null;
    if (cpuToMove()) cpuTurn();
  },
});

game.session.onReset(() => (game.session.state.selected = null));
game.session.state.selected = null; // cosmetic: the piece in hand (render reads it)

// The start card: pick your opponent before the first move.
startCard({
  title: "CHESS",
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
  const index = pickCell(game.canvas, e, boardGeometry(game.canvas, Chess.SIZE));
  if (index === -1) return;

  const piece = state.cells[index];
  if (piece && piece.side === state.turn) {
    // Pick up / put down — the render glows the hand and its landings.
    state.selected = state.selected === index ? null : index;
    game.draw();
  } else if (state.selected !== null && state.selected !== undefined) {
    game.act(Chess.move(state, state.selected, index)); // pawns crown as queens
  }
});
