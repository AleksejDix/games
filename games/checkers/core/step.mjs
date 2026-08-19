// The actions of English draughts. The load-bearing rule is the FORCED
// capture: if any of your pieces can jump, only jumps are legal — and a
// piece mid-chain must keep jumping until it runs dry or is crowned
// (the crown ends the move; that is the rule, not a mercy).

import { SIZE, SIDES, playable } from "./constants.mjs";
import { transition } from "./machine.mjs";

export function step() {
  return [];
}

const other = (side) => SIDES.find((s) => s !== side);
const row = (i) => Math.floor(i / SIZE);
const col = (i) => i % SIZE;
const at = (r, c) =>
  r >= 0 && r < SIZE && c >= 0 && c < SIZE && playable(r, c) ? r * SIZE + c : -1;

// Men march away from home; kings own both directions.
const directions = (piece) =>
  piece.king ? [-1, 1] : [piece.side === "red" ? -1 : 1];

// Every move one piece could make: { to, over } — over is the captured
// square, or null for a plain step.
function pieceMoves(cells, i) {
  const piece = cells[i];
  const moves = [];
  for (const dr of directions(piece)) {
    for (const dc of [-1, 1]) {
      const step = at(row(i) + dr, col(i) + dc);
      if (step === -1) continue;
      if (!cells[step]) {
        moves.push({ to: step, over: null });
      } else if (cells[step].side !== piece.side) {
        const landing = at(row(i) + dr * 2, col(i) + dc * 2);
        if (landing !== -1 && !cells[landing]) moves.push({ to: landing, over: step });
      }
    }
  }
  return moves;
}

const captures = (cells, i) => pieceMoves(cells, i).filter((m) => m.over !== null);

const sideMustCapture = (cells, side) =>
  cells.some((p, i) => p && p.side === side && captures(cells, i).length > 0);

// The legal moves for one piece under the WHOLE position's rules: a
// chain locks the board to one piece, and any available capture
// anywhere outlaws plain steps. Exported for the renderer's hints —
// what looks playable IS playable, the house line since Peg.
export function legalMoves(state, i) {
  const piece = state.cells[i];
  if (!piece || piece.side !== state.turn) return [];
  if (state.chained !== null) {
    return i === state.chained ? captures(state.cells, i) : [];
  }
  if (sideMustCapture(state.cells, state.turn)) return captures(state.cells, i);
  return pieceMoves(state.cells, i);
}

// Every piece the side to move could pick up — the UI's hint, and the
// blocked-is-lost rule's evidence.
export function movablePieces(state) {
  return state.cells.flatMap((p, i) =>
    p && p.side === state.turn && legalMoves(state, i).length > 0 ? [i] : []
  );
}

export function move(state, from, to) {
  if (state.status !== "playing") return [];
  const chosen = legalMoves(state, from).find((m) => m.to === to);
  if (!chosen) return [];

  const piece = state.cells[from];
  const events = [{ type: "moved", from, to, side: piece.side }];

  state.cells[to] = piece;
  state.cells[from] = null;
  if (chosen.over !== null) {
    state.cells[chosen.over] = null;
    events.push({ type: "captured", index: chosen.over, by: piece.side });
  }

  // The back rank crowns — and crowning ENDS the move, chain or no chain.
  const backRank = piece.side === "red" ? 0 : SIZE - 1;
  const crowned = !piece.king && row(to) === backRank;
  if (crowned) {
    piece.king = true;
    events.push({ type: "crowned", index: to, side: piece.side });
  }

  // A capture that can keep capturing keeps the turn — the chain.
  if (chosen.over !== null && !crowned && captures(state.cells, to).length > 0) {
    state.chained = to;
    events.push({ type: "chain", index: to });
    return events;
  }

  state.chained = null;
  state.turn = other(piece.side);

  // No pieces, or no moves: either way the game is over, and the side
  // that just moved has won.
  if (movablePieces(state).length === 0) {
    state.winner = piece.side;
    transition(state, "won");
    events.push({ type: "won", winner: piece.side });
  }
  return events;
}
