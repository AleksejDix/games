// The one action of Connect Four: drop(state, col). Gravity is the
// rule — a disc takes the LOWEST empty cell in its column, never a
// chosen one — so the whole move is a column number. step() is the
// honest no-op the contract asks of clockless worlds.

import { COLS, ROWS, SIDES, LINES_AT } from "./constants.mjs";
import { transition } from "./machine.mjs";

export function step() {
  return [];
}

const other = (side) => SIDES.find((s) => s !== side);

// Where a disc dropped in this column comes to rest: the bottom-most
// empty cell, or -1 for a full column. Scanning bottom-up IS gravity.
export function landingIndex(cells, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (cells[r * COLS + col] === null) return r * COLS + col;
  }
  return -1;
}

// The columns still open — the whole move list. Exported so the bot
// searches over the core's own legality, not its own idea of it.
export function openColumns(cells) {
  const cols = [];
  for (let col = 0; col < COLS; col++) {
    if (cells[col] === null) cols.push(col); // row 0's cell IS index col
  }
  return cols;
}

// The four-in-a-row a fresh disc completed, or null. Only the lines
// through the landing cell can have changed — LINES_AT makes the win
// check a lookup, not a board scan. The bot leans on this too.
export function winningLine(cells, index) {
  const side = cells[index];
  return LINES_AT[index].find((line) => line.every((i) => cells[i] === side)) ?? null;
}

export function drop(state, col) {
  // Range-check the column ourselves: the core is a public API — it
  // cannot lean on the shell's pickCell staying polite.
  if (state.status !== "playing" || !Number.isInteger(col) || col < 0 || col >= COLS) return [];
  const index = landingIndex(state.cells, col);
  if (index === -1) return []; // the column is full

  const side = state.turn;
  state.cells[index] = side;
  const events = [{ type: "dropped", col, index, side }];

  const line = winningLine(state.cells, index);
  if (line) {
    state.winner = side;
    state.line = line;
    transition(state, "won");
    events.push({ type: "won", winner: side, line });
  } else if (openColumns(state.cells).length === 0) {
    transition(state, "draw");
    events.push({ type: "draw" });
  } else {
    state.turn = other(side);
  }
  return events;
}
