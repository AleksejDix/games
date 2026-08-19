// ============================================================================
// game.mjs — Reversi, DECLARED on the turn engine. One-click play: tap
// a glowing square, the flanked discs turn. What remains here is only
// Reversi's own: the machine's thinking pause (Checkers' guards, so a
// restart mid-pause can't confuse it) — looped, because a pass can hand
// the machine two turns in a row.
// ============================================================================

import * as Reversi from "./logic.mjs";
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

// The machine takes its turn after a beat — and takes another if the
// human's pass returns it. Live-state guards throughout.
function cpuTurn() {
  setTimeout(() => {
    if (!cpuToMove()) return;
    const m = Reversi.botMove(game.session.state);
    if (m !== null) game.act(Reversi.place(game.session.state, m));
    if (cpuToMove()) cpuTurn(); // still white: the human passed
  }, 400);
}

const game = createTurnGame({
  core: Reversi,
  render,
  options: () => ({}),
  settings: {
    storageKey: "reversiSettings",
    defaults: { opponent: "cpu" },
    read: () => ({ opponent: opponentEl.value }),
    write: (s) => {
      opponentEl.value = s.opponent;
    },
    worldEls: [opponentEl],
  },
  sounds: {
    placed: () => beep({ freq: 300, duration: 0.04, volume: 0.07 }),
    flipped: () => beep({ freq: 220, duration: 0.07, volume: 0.08 }),
    passed: () => beep({ freq: 280, slideTo: 160, duration: 0.15, volume: 0.1 }),
    won: () => fanfare(),
    draw: () => beep({ freq: 240, duration: 0.2, volume: 0.08 }),
  },
  hud: (state) => {
    const count = (side) => state.cells.filter((d) => d === side).length;
    const black = count("black");
    const white = count("white");
    return {
      score:
        state.status === "won"
          ? state.winner === "black"
            ? `black wins ${black} : ${white}`
            : `white wins ${white} : ${black}`
          : state.status === "draw"
            ? `a draw ${black} : ${white}`
            : `${state.turn === "black" ? "▶" : ""}black ${black} · ` +
              `${state.turn === "white" ? "▶" : ""}white ${white}`,
    };
  },
  afterAct: () => {
    if (cpuToMove()) cpuTurn();
  },
});

// The start card: pick your opponent before the first disc.
startCard({
  title: "REVERSI",
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
  const index = pickCell(game.canvas, e, boardGeometry(game.canvas, Reversi.SIZE));
  if (index === -1) return;
  game.act(Reversi.place(state, index));
});
