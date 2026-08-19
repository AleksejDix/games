// The machine's Connect Four: minimax with alpha-beta over the core's
// own openColumns — the search cannot want a full column. Columns are
// tried center-out (the middle touches the most lines), so good moves
// surface early and the pruning bites hard; that ordering is why depth
// 7 stays instant. Scores are red-positive; the caller's side decides
// which way to optimize. Deterministic, like OXO's minimax: no
// randomness to inject, nothing to replay — ties go to the most
// central column, always.

import { COLS, ROWS, SIDES, LINES, CENTER_OUT } from "./constants.mjs";
import { landingIndex, openColumns, winningLine } from "./step.mjs";

const other = (side) => SIDES.find((s) => s !== side);

// Wins outrank everything a heuristic can say; depth added on top makes
// a win NOW worth more than the same win later — the machine closes
// games out instead of toying with them (and drags a lost one out).
const WIN = 1000;

// The heuristic, for positions the search can't play to the end: count
// the open threats. A line two enemies share is dead wood; an unshared
// pair is a seed, an unshared triple is a loaded gun. Plus a nudge for
// owning the center column — it touches more lines than any other.
function evaluate(cells) {
  let total = 0;
  for (const line of LINES) {
    let red = 0;
    let gold = 0;
    for (const i of line) {
      if (cells[i] === "red") red++;
      else if (cells[i] === "gold") gold++;
    }
    if (red && gold) continue; // both colors in it: nobody's line anymore
    if (red === 3) total += 50;
    else if (red === 2) total += 5;
    if (gold === 3) total -= 50;
    else if (gold === 2) total -= 5;
  }
  for (let r = 0; r < ROWS; r++) {
    const p = cells[r * COLS + 3];
    if (p === "red") total += 3;
    else if (p === "gold") total -= 3;
  }
  return total;
}

// Drop without the ceremony of events — same gravity as step.mjs's
// drop(). Returns the landing index; the caller checks it for a win.
function apply(cells, col, side) {
  const next = cells.slice();
  const index = landingIndex(next, col);
  next[index] = side;
  return { next, index };
}

const legalOrdered = (cells) => {
  const open = openColumns(cells);
  return CENTER_OUT.filter((c) => open.includes(c));
};

function minimax(cells, turn, depth, alpha, beta) {
  const moves = legalOrdered(cells);
  if (moves.length === 0) return 0; // the rack is full: a draw
  if (depth === 0) return evaluate(cells);

  const maximizing = turn === "red";
  let best = maximizing ? -Infinity : Infinity;
  for (const col of moves) {
    const { next, index } = apply(cells, col, turn);
    // A winning drop ends the branch here — no recursing past the end.
    const value = winningLine(next, index)
      ? (maximizing ? WIN + depth : -(WIN + depth))
      : minimax(next, other(turn), depth - 1, alpha, beta);
    if (maximizing) {
      best = Math.max(best, value);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, value);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

// The best column for whoever is to move.
export function botMove(state, depth = 7) {
  const turn = state.turn;
  const maximizing = turn === "red";
  let best = null;
  let bestScore = maximizing ? -Infinity : Infinity;
  for (const col of legalOrdered(state.cells)) {
    const { next, index } = apply(state.cells, col, turn);
    const value = winningLine(next, index)
      ? (maximizing ? WIN + depth : -(WIN + depth))
      : minimax(next, other(turn), depth - 1, -Infinity, Infinity);
    const better = maximizing ? value > bestScore : value < bestScore;
    if (better || best === null) {
      bestScore = value;
      best = col;
    }
  }
  return best;
}
