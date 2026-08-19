// The machine's checkers: minimax with alpha-beta over the core's own
// legal-move generator — the search cannot want an illegal move, forced
// captures included. Chains fall out naturally: a jump that must
// continue keeps the turn, so the search just recurses without flipping
// sides. Scores are red-positive; the caller's side decides which way
// to optimize. Deterministic, like OXO's minimax: no randomness to
// inject, nothing to replay.

import { SIZE, SIDES } from "./constants.mjs";
import { legalMoves } from "./step.mjs";

const other = (side) => SIDES.find((s) => s !== side);
const row = (i) => Math.floor(i / SIZE);

// A light simulation frame: enough state for the rules, nothing else.
const frame = (cells, turn, chained) => ({
  cells,
  turn,
  chained,
  status: "playing", // legalMoves only asks whose turn and where the chain is
});

const cloneCells = (cells) => cells.map((p) => (p ? { ...p } : null));

function allMoves(sim) {
  const moves = [];
  sim.cells.forEach((p, i) => {
    if (p && p.side === sim.turn) {
      for (const m of legalMoves(sim, i)) moves.push({ from: i, ...m });
    }
  });
  return moves;
}

// Apply without the ceremony of events — same rules as step.mjs's move().
function apply(sim, m) {
  const cells = cloneCells(sim.cells);
  const piece = cells[m.to] = cells[m.from];
  cells[m.from] = null;
  if (m.over !== null) cells[m.over] = null;
  const backRank = piece.side === "red" ? 0 : SIZE - 1;
  const crowned = !piece.king && row(m.to) === backRank;
  if (crowned) piece.king = true;

  const next = frame(cells, sim.turn, null);
  if (m.over !== null && !crowned && legalMoves(frame(cells, sim.turn, m.to), m.to).length > 0) {
    next.chained = m.to; // the chain: same side jumps again
  } else {
    next.turn = other(sim.turn);
  }
  return next;
}

// Material plus a nudge: kings are worth more, and a man that has
// marched is worth slightly more than one still at home.
function score(cells) {
  let total = 0;
  cells.forEach((p, i) => {
    if (!p) return;
    const value = p.king ? 1.6 : 1 + 0.02 * (p.side === "red" ? 7 - row(i) : row(i));
    total += p.side === "red" ? value : -value;
  });
  return total;
}

function minimax(sim, depth, alpha, beta) {
  const moves = allMoves(sim);
  // No moves = the side to move has lost. Prefer quick wins and slow
  // losses: depth in the score keeps the machine honest at the end.
  if (moves.length === 0) return sim.turn === "red" ? -100 - depth : 100 + depth;
  if (depth === 0) return score(sim.cells);

  if (sim.turn === "red") {
    let best = -Infinity;
    for (const m of moves) {
      best = Math.max(best, minimax(apply(sim, m), depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    best = Math.min(best, minimax(apply(sim, m), depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

// The best { from, to } for whoever is to move — mid-chain included.
export function botMove(state, depth = 5) {
  const sim = frame(cloneCells(state.cells), state.turn, state.chained);
  const moves = allMoves(sim);
  let best = null;
  let bestScore = state.turn === "red" ? -Infinity : Infinity;
  for (const m of moves) {
    const value = minimax(apply(sim, m), depth - 1, -Infinity, Infinity);
    const better = state.turn === "red" ? value > bestScore : value < bestScore;
    if (better || best === null) {
      bestScore = value;
      best = m;
    }
  }
  return best && { from: best.from, to: best.to };
}
