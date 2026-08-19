// The actions of a turn-based duel. step() is the honest no-op the
// contract asks of clockless worlds.

import { LINES } from "./constants.mjs";
import { transition } from "./machine.mjs";

export function step() {
  return [];
}

export function place(state, index) {
  // `index in cells` guards the range: an out-of-board index reads
  // undefined (falsy), which would slip past the occupied-cell check,
  // grow the board, and burn the turn. The core is a public API — it
  // cannot lean on the shell's pickCell staying polite.
  if (state.status !== "playing" || !(index in state.cells) || state.cells[index]) return [];

  const mark = state.turn;
  state.cells[index] = mark;
  const events = [{ type: "placed", mark, index }];

  const line = LINES.find((l) => l.every((i) => state.cells[i] === mark));
  if (line) {
    state.winner = mark;
    state.line = line;
    transition(state, "won");
    events.push({ type: "won", mark, line });
  } else if (state.cells.every(Boolean)) {
    transition(state, "draw");
    events.push({ type: "draw" });
  } else {
    state.turn = mark === "X" ? "O" : "X";
  }
  return events;
}
