// The machine's reversi: minimax with alpha-beta over the core's own
// legalPlacements — the search cannot want an illegal square. The
// evaluation is the classic pair: WHERE the discs sit (corners are
// forever, the squares beside an empty corner are gifts to the enemy)
// plus MOBILITY (moves in hand), because raw disc count famously lies
// until the very end. A pass happens inside the search too: no move
// flips the turn without placing anything. Scores are black-positive;
// the caller's side decides which way to optimize. Deterministic, like
// OXO's minimax: no randomness to inject, nothing to replay.

import { SIZE, SIDES } from "./constants.mjs";
import { flipsFor, legalPlacements } from "./step.mjs";

const other = (side) => SIDES.find((s) => s !== side);

const CORNERS = [0, SIZE - 1, SIZE * (SIZE - 1), SIZE * SIZE - 1];

// Which corner (if any) each square touches — the C- and X-squares
// whose worth depends on whether that corner is still up for grabs.
const NEAR_CORNER = (() => {
  const map = Array(SIZE * SIZE).fill(-1);
  for (const corner of CORNERS) {
    const row = Math.floor(corner / SIZE);
    const col = corner % SIZE;
    for (const dr of [-1, 0, 1]) {
      for (const dc of [-1, 0, 1]) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) continue;
        if (dr !== 0 || dc !== 0) map[r * SIZE + c] = corner;
      }
    }
  }
  return map;
})();

const onEdge = (i) => {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  return r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1;
};

// A square's worth: corners 25, edges 5, plain squares 1 — but a square
// beside a STILL-EMPTY corner is a liability, because it hands the
// corner over.
function weight(cells, i) {
  if (CORNERS.includes(i)) return 25;
  if (NEAR_CORNER[i] !== -1 && cells[NEAR_CORNER[i]] === null) return -8;
  return onEdge(i) ? 5 : 1;
}

const frame = (cells, turn) => ({ cells, turn }); // all legalPlacements reads

const mobility = (cells, side) => legalPlacements(frame(cells, side)).length;

// Position plus tempo, black-positive.
function evaluate(cells) {
  let total = 0;
  cells.forEach((disc, i) => {
    if (!disc) return;
    total += disc === "black" ? weight(cells, i) : -weight(cells, i);
  });
  return total + 2 * (mobility(cells, "black") - mobility(cells, "white"));
}

// Apply without the ceremony of events — same rules as step.mjs's place().
function apply(sim, index) {
  const cells = sim.cells.slice();
  cells[index] = sim.turn;
  for (const i of flipsFor(sim.cells, index, sim.turn)) cells[i] = sim.turn;
  return frame(cells, other(sim.turn));
}

function minimax(sim, depth, alpha, beta) {
  const moves = legalPlacements(sim);
  if (moves.length === 0) {
    // No placement: a pass, unless the other side is stuck too — then
    // the board gets counted, and the count is everything. Depth in
    // the score keeps the machine preferring quick wins, slow losses.
    if (mobility(sim.cells, other(sim.turn)) === 0) {
      const black = sim.cells.filter((c) => c === "black").length;
      const white = sim.cells.filter((c) => c === "white").length;
      if (black === white) return 0;
      return black > white ? 1000 + black - white + depth : -1000 - (white - black) - depth;
    }
    return minimax(frame(sim.cells, other(sim.turn)), depth - 1, alpha, beta);
  }
  if (depth <= 0) return evaluate(sim.cells);

  if (sim.turn === "black") {
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

// The best square for whoever is to move, or null when only a pass
// remains (place() handles passes itself, so the shell never sends one).
export function botMove(state, depth = 4) {
  const sim = frame(state.cells.slice(), state.turn);
  let best = null;
  let bestScore = state.turn === "black" ? -Infinity : Infinity;
  for (const m of legalPlacements(sim)) {
    const value = minimax(apply(sim, m), depth - 1, -Infinity, Infinity);
    const better = state.turn === "black" ? value > bestScore : value < bestScore;
    if (better || best === null) {
      bestScore = value;
      best = m;
    }
  }
  return best;
}
