// ============================================================================
// moves.mjs — LEGAL move generation, the heart of the rules.
//
// The pipeline every engine shares: pseudo-legal moves (how pieces go),
// then the legality filter (a move may not leave your own king en
// prise). Pins, discovered checks, and the en-passant-exposes-check
// trap all fall out of that one filter — no special cases, just "play
// it and look". Castling is the exception that checks DURING generation,
// because its legality depends on squares the king passes THROUGH.
//
// Correctness has one judge here: perft. The test suite walks every
// move sequence to depth N and compares against the published node
// counts — one number that catches virtually every movegen bug known.
// ============================================================================

import { SIZE, SIDES } from "./constants.mjs";

export const other = (side) => SIDES.find((s) => s !== side);
const row = (i) => Math.floor(i / SIZE);
const col = (i) => i % SIZE;
const at = (r, c) => (r >= 0 && r < SIZE && c >= 0 && c < SIZE ? r * SIZE + c : -1);

const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTHO = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const pawnDir = (side) => (side === "white" ? -1 : 1);

// Is `target` attacked by any piece of `bySide`? Asked for checks and
// for the squares a castling king travels through.
export function attacked(cells, target, bySide) {
  const r = row(target);
  const c = col(target);

  for (const [dr, dc] of KNIGHT) {
    const i = at(r + dr, c + dc);
    if (i !== -1 && cells[i]?.side === bySide && cells[i].type === "n") return true;
  }
  for (const [dr, dc] of KING) {
    const i = at(r + dr, c + dc);
    if (i !== -1 && cells[i]?.side === bySide && cells[i].type === "k") return true;
  }
  // A pawn of bySide attacks target from one row BEHIND its direction.
  for (const dc of [-1, 1]) {
    const i = at(r - pawnDir(bySide), c + dc);
    if (i !== -1 && cells[i]?.side === bySide && cells[i].type === "p") return true;
  }
  // Sliders: walk each ray to the first piece and ask what it is.
  for (const [rays, types] of [[DIAG, ["b", "q"]], [ORTHO, ["r", "q"]]]) {
    for (const [dr, dc] of rays) {
      for (let step = 1; ; step++) {
        const i = at(r + dr * step, c + dc * step);
        if (i === -1) break;
        const piece = cells[i];
        if (!piece) continue;
        if (piece.side === bySide && types.includes(piece.type)) return true;
        break;
      }
    }
  }
  return false;
}

export function kingIndex(cells, side) {
  return cells.findIndex((p) => p?.side === side && p.type === "k");
}

export function inCheck(state, side) {
  return attacked(state.cells, kingIndex(state.cells, side), other(side));
}

// How the pieces go, before legality. Moves are { to, promo?, ep?,
// double?, castle? } — promotions enumerate all four pieces, because
// each IS a distinct move (perft counts them separately, and so do we).
function pseudoMoves(state, from) {
  const { cells } = state;
  const piece = cells[from];
  const r = row(from);
  const c = col(from);
  const moves = [];
  const push = (to, extra) => moves.push({ to, ...extra });

  if (piece.type === "p") {
    const dir = pawnDir(piece.side);
    const promoRank = piece.side === "white" ? 0 : SIZE - 1;
    const startRank = piece.side === "white" ? 6 : 1;
    const advance = (to, extra) => {
      if (row(to) === promoRank) {
        for (const promo of ["q", "r", "b", "n"]) push(to, { ...extra, promo });
      } else {
        push(to, extra);
      }
    };

    const one = at(r + dir, c);
    if (one !== -1 && !cells[one]) {
      advance(one);
      const two = at(r + dir * 2, c);
      if (r === startRank && two !== -1 && !cells[two]) push(two, { double: one });
    }
    for (const dc of [-1, 1]) {
      const diag = at(r + dir, c + dc);
      if (diag === -1) continue;
      if (cells[diag] && cells[diag].side !== piece.side) advance(diag);
      else if (diag === state.ep) push(diag, { ep: true });
    }
    return moves;
  }

  if (piece.type === "n" || piece.type === "k") {
    for (const [dr, dc] of piece.type === "n" ? KNIGHT : KING) {
      const i = at(r + dr, c + dc);
      if (i !== -1 && cells[i]?.side !== piece.side) push(i);
    }
    if (piece.type === "k") castleMoves(state, from, push);
    return moves;
  }

  const rays = piece.type === "b" ? DIAG : piece.type === "r" ? ORTHO : [...DIAG, ...ORTHO];
  for (const [dr, dc] of rays) {
    for (let step = 1; ; step++) {
      const i = at(r + dr * step, c + dc * step);
      if (i === -1) break;
      if (!cells[i]) {
        push(i);
        continue;
      }
      if (cells[i].side !== piece.side) push(i);
      break;
    }
  }
  return moves;
}

// Castling checks legality as it generates: the lane must be empty, and
// the king may stand on, pass through, or land on no attacked square.
function castleMoves(state, from, push) {
  const side = state.cells[from].side;
  const home = side === "white" ? 7 : 0;
  if (from !== at(home, 4)) return;
  const enemy = other(side);
  const rights = side === "white" ? ["K", "Q"] : ["k", "q"];
  const lanes = [
    { right: rights[0], empties: [5, 6], through: [4, 5, 6], to: at(home, 6), castle: "k" },
    { right: rights[1], empties: [1, 2, 3], through: [4, 3, 2], to: at(home, 2), castle: "q" },
  ];
  for (const lane of lanes) {
    if (!state.castling[lane.right]) continue;
    if (lane.empties.some((c) => state.cells[at(home, c)])) continue;
    if (lane.through.some((c) => attacked(state.cells, at(home, c), enemy))) continue;
    push(lane.to, { castle: lane.castle });
  }
}

// Play a move onto a COPY of the board — just enough to ask about check.
// The real apply (rights, clocks, events) lives in step.mjs.
export function preview(cells, from, move) {
  const next = cells.slice();
  const piece = next[from];
  next[move.to] = move.promo ? { side: piece.side, type: move.promo } : piece;
  next[from] = null;
  if (move.ep) next[move.to + (piece.side === "white" ? SIZE : -SIZE)] = null;
  if (move.castle) {
    const home = piece.side === "white" ? 7 : 0;
    const [rookFrom, rookTo] = move.castle === "k" ? [7, 5] : [0, 3];
    next[at(home, rookTo)] = next[at(home, rookFrom)];
    next[at(home, rookFrom)] = null;
  }
  return next;
}

// The rule that makes chess chess: a move may not leave your own king
// attacked. One filter, and pins simply exist.
export function legalMoves(state, from) {
  const piece = state.cells[from];
  if (!piece || piece.side !== state.turn || state.status !== "playing") return [];
  return pseudoMoves(state, from).filter((m) => {
    const after = preview(state.cells, from, m);
    return !attacked(after, kingIndex(after, piece.side), other(piece.side));
  });
}

export function allLegalMoves(state) {
  const moves = [];
  state.cells.forEach((p, i) => {
    if (p && p.side === state.turn) {
      for (const m of legalMoves(state, i)) moves.push({ from: i, ...m });
    }
  });
  return moves;
}
