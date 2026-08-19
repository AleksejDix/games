// The one action: move(state, from, to, promotion). The generator in
// moves.mjs has already decided what is legal; this file OWNS the
// consequences — captures, the rook's half of castling, the en-passant
// window, promotion, the rights and the clocks, and the three ways a
// game of chess ends.

import { SIZE } from "./constants.mjs";
import { transition } from "./machine.mjs";
import { legalMoves, allLegalMoves, inCheck, other } from "./moves.mjs";

export function step() {
  return [];
}

const at = (r, c) => r * SIZE + c;

// Castling rights die with the first move OF or THROUGH their corner:
// the king's move clears both, a rook's move (or capture!) its own.
const RIGHT_BY_SQUARE = {
  [at(7, 4)]: ["K", "Q"],
  [at(7, 7)]: ["K"],
  [at(7, 0)]: ["Q"],
  [at(0, 4)]: ["k", "q"],
  [at(0, 7)]: ["k"],
  [at(0, 0)]: ["q"],
};

export function move(state, from, to, promotion = "q") {
  if (state.status !== "playing") return [];
  const chosen = legalMoves(state, from).find(
    (m) => m.to === to && (m.promo === undefined || m.promo === promotion)
  );
  if (!chosen) return [];

  const piece = state.cells[from];
  const events = [{ type: "moved", from, to, side: piece.side, piece: piece.type }];

  // The capture, ordinary or en passant (where the victim is BESIDE the
  // landing square — the only capture in chess that is).
  const victimIndex = chosen.ep ? to + (piece.side === "white" ? SIZE : -SIZE) : to;
  const victim = state.cells[victimIndex];
  if (victim) {
    state.cells[victimIndex] = null;
    events.push({ type: "captured", index: victimIndex, piece: victim.type, by: piece.side });
  }

  state.cells[to] = chosen.promo ? { side: piece.side, type: chosen.promo } : piece;
  state.cells[from] = null;
  if (chosen.promo) events.push({ type: "promoted", index: to, piece: chosen.promo });

  if (chosen.castle) {
    const home = piece.side === "white" ? 7 : 0;
    const [rookFrom, rookTo] = chosen.castle === "k" ? [7, 5] : [0, 3];
    state.cells[at(home, rookTo)] = state.cells[at(home, rookFrom)];
    state.cells[at(home, rookFrom)] = null;
    events.push({ type: "castled", side: piece.side, wing: chosen.castle });
  }

  for (const square of [from, victimIndex]) {
    for (const right of RIGHT_BY_SQUARE[square] ?? []) state.castling[right] = false;
  }

  // The en-passant window: open for exactly one reply, then gone.
  state.ep = chosen.double ?? null;

  // The fifty-move clock: pawns and captures reset it; everything else
  // marches it toward the hundredth half-move.
  state.halfmove = piece.type === "p" || victim ? 0 : state.halfmove + 1;

  state.turn = other(piece.side);

  // The three endings, in order of authority: mate beats everything,
  // stalemate is a draw however the clock stands, then the fifty moves.
  const replies = allLegalMoves(state);
  const check = inCheck(state, state.turn);
  if (replies.length === 0) {
    if (check) {
      state.winner = piece.side;
      transition(state, "won");
      events.push({ type: "won", winner: piece.side, by: "checkmate" });
    } else {
      transition(state, "draw");
      events.push({ type: "draw", reason: "stalemate" });
    }
  } else if (state.halfmove >= 100) {
    transition(state, "draw");
    events.push({ type: "draw", reason: "fifty moves" });
  } else if (check) {
    events.push({ type: "check", side: state.turn });
  }
  return events;
}

// perft: the movegen's judge. Counts every legal move sequence to the
// given depth — compared against published numbers in the tests, it
// catches virtually every generation bug in existence.
export function perft(state, depth) {
  if (depth === 0) return 1;
  let nodes = 0;
  for (const m of allLegalMoves(state)) {
    const saved = snapshotFor(state);
    move(state, m.from, m.to, m.promo ?? "q");
    // An ended game generates no further moves, so the recursion counts
    // it as zero children by itself — exactly perft's convention.
    nodes += perft(state, depth - 1);
    restoreFrom(state, saved);
  }
  return nodes;
}

// perft needs cheap save/restore of exactly the rule-bearing state.
const snapshotFor = (state) => ({
  cells: state.cells.slice(),
  turn: state.turn,
  castling: { ...state.castling },
  ep: state.ep,
  halfmove: state.halfmove,
  winner: state.winner,
  status: state.status,
});

function restoreFrom(state, saved) {
  state.cells = saved.cells;
  state.turn = saved.turn;
  state.castling = saved.castling;
  state.ep = saved.ep;
  state.halfmove = saved.halfmove;
  state.winner = saved.winner;
  state.status = saved.status;
}
