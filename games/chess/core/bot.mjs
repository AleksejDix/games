// The machine's chess: alpha-beta minimax over the core's own legal
// generator — it cannot want an illegal move. Material plus a small
// centre pull, captures searched first for the pruning. Depth three:
// honest about what that buys — a coherent, beatable club beginner,
// which is exactly the rung this shelf's ladder wanted between OXO
// (unbeatable) and a human. Deterministic, like every bot here.

import { SIZE, VALUES } from "./constants.mjs";
import { allLegalMoves, preview, other, kingIndex, attacked } from "./moves.mjs";

const row = (i) => Math.floor(i / SIZE);
const col = (i) => i % SIZE;

// A light frame the generator accepts: board, turn, rights, ep window.
const frame = (state) => ({
  cells: state.cells,
  turn: state.turn,
  castling: state.castling,
  ep: state.ep,
  status: "playing",
});

// Apply just enough for the search: preview covers the board (rook,
// en passant, promotion included); rights and the ep window ride along.
function apply(sim, m) {
  const piece = sim.cells[m.from];
  return {
    cells: preview(sim.cells, m.from, m),
    turn: other(sim.turn),
    // Rights only ever shrink; the search can afford the blunt version:
    // moving a king or rook forfeits, which is what the endings need.
    castling: shrinkRights(sim, m, piece),
    ep: m.double ?? null,
    status: "playing",
  };
}

function shrinkRights(sim, m, piece) {
  if (piece.type !== "k" && piece.type !== "r") return sim.castling;
  const next = { ...sim.castling };
  if (piece.type === "k") {
    if (piece.side === "white") next.K = next.Q = false;
    else next.k = next.q = false;
  } else {
    const home = piece.side === "white" ? 7 : 0;
    if (m.from === home * SIZE + 7) next[piece.side === "white" ? "K" : "k"] = false;
    if (m.from === home * SIZE) next[piece.side === "white" ? "Q" : "q"] = false;
  }
  return next;
}

// White-positive material, with a whisper of centralisation.
function score(cells) {
  let total = 0;
  cells.forEach((p, i) => {
    if (!p) return;
    const centre = 0.04 - 0.01 * (Math.abs(3.5 - row(i)) + Math.abs(3.5 - col(i)));
    const value = VALUES[p.type] + (p.type === "k" ? 0 : centre);
    total += p.side === "white" ? value : -value;
  });
  return total;
}

// Captures first: alpha-beta prunes best when the loud moves lead.
const ordered = (sim) =>
  allLegalMoves(sim).sort((a, b) => (sim.cells[b.to] ? 1 : 0) - (sim.cells[a.to] ? 1 : 0));

function minimax(sim, depth, alpha, beta) {
  const moves = ordered(sim);
  if (moves.length === 0) {
    // Mate or stalemate: ask which. Depth keeps mates preferred sooner.
    const mated = attacked(sim.cells, kingIndex(sim.cells, sim.turn), other(sim.turn));
    if (!mated) return 0;
    return sim.turn === "white" ? -1000 - depth : 1000 + depth;
  }
  if (depth === 0) return score(sim.cells);

  if (sim.turn === "white") {
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

// The best { from, to, promo } for whoever is to move.
export function botMove(state, depth = 3) {
  const sim = frame(state);
  let best = null;
  let bestScore = state.turn === "white" ? -Infinity : Infinity;
  for (const m of ordered(sim)) {
    const value = minimax(apply(sim, m), depth - 1, -Infinity, Infinity);
    const better = state.turn === "white" ? value > bestScore : value < bestScore;
    if (better || best === null) {
      bestScore = value;
      best = m;
    }
  }
  return best && { from: best.from, to: best.to, promo: best.promo ?? "q" };
}
