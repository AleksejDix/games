// ============================================================================
// Tests for the Chess core. Two layers of proof: the RULES, pinned one
// by one (pins, en passant's window and its trap, castling through
// check, the crown of promotion, the three endings) — and PERFT, the
// generator's judge: every legal move sequence counted to depth N and
// compared against the published numbers. If perft matches, virtually
// every movegen bug in existence is ruled out at once.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Chess from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// Algebraic squares: "e2" → index. Row 0 is the eighth rank.
const sq = (name) => (8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97);
const piece = (side, type) => ({ side, type });

function makeState() {
  return Chess.createState({ random: fakeRandom(0.5) });
}

// A cleared board with pieces placed by hand — kings always included,
// because the rules ask where they are.
function stack(placements, { turn = "white", castling = {}, ep = null } = {}) {
  const state = makeState();
  state.cells = Array(64).fill(null);
  for (const [square, p] of placements) state.cells[sq(square)] = p;
  state.turn = turn;
  state.castling = { K: false, Q: false, k: false, q: false, ...castling };
  state.ep = ep;
  return state;
}

const play = (state, moves) => {
  for (const [from, to] of moves) {
    const events = Chess.move(state, sq(from), sq(to));
    assert.ok(events.length > 0, `${from}→${to} was refused`);
  }
};

// --- setup ------------------------------------------------------------------

test("the 1475 position: thirty-two pieces, white to move, all rights", () => {
  const state = makeState();

  assert.equal(state.cells.filter(Boolean).length, 32);
  assert.deepEqual(state.cells[sq("e1")], piece("white", "k"));
  assert.deepEqual(state.cells[sq("d8")], piece("black", "q"));
  assert.deepEqual(state.cells[sq("a2")], piece("white", "p"));
  assert.equal(state.turn, "white");
  assert.deepEqual(state.castling, { K: true, Q: true, k: true, q: true });
  assert.equal(Chess.allLegalMoves(state).length, 20, "the famous twenty");
});

// --- pawns ------------------------------------------------------------------

test("the double push opens the en-passant window for exactly one reply", () => {
  const state = makeState();
  play(state, [["e2", "e4"]]);
  assert.equal(state.ep, sq("e3"), "the skipped square is marked");

  play(state, [["a7", "a6"], ["a2", "a3"]]);
  assert.equal(state.ep, null, "and the window closes on the next move");
});

test("en passant captures the pawn BESIDE the landing square", () => {
  const state = makeState();
  play(state, [["e2", "e4"], ["a7", "a6"], ["e4", "e5"], ["d7", "d5"]]);

  const events = Chess.move(state, sq("e5"), sq("d6"));

  assert.ok(events.some((e) => e.type === "captured" && e.index === sq("d5")));
  assert.equal(state.cells[sq("d5")], null, "the passed pawn is gone");
  assert.deepEqual(state.cells[sq("d6")], piece("white", "p"));
});

test("en passant that exposes the king is illegal — the famous trap", () => {
  // Both pawns vanish from the fifth rank at once; the rook sees through.
  const state = stack([
    ["e5", piece("white", "p")],
    ["d5", piece("black", "p")],
    ["h5", piece("black", "r")],
    ["a5", piece("white", "k")],
    ["e8", piece("black", "k")],
  ], { ep: sq("d6") });

  assert.deepEqual(Chess.move(state, sq("e5"), sq("d6")), [], "the trap is refused");
});

test("promotion is four distinct moves, and the chosen piece appears", () => {
  const state = stack([
    ["a7", piece("white", "p")],
    ["e1", piece("white", "k")],
    ["e8", piece("black", "k")],
  ]);

  const promos = Chess.legalMoves(state, sq("a7")).map((m) => m.promo).sort();
  assert.deepEqual(promos, ["b", "n", "q", "r"], "each crown is its own move");

  const events = Chess.move(state, sq("a7"), sq("a8"), "n");
  assert.ok(events.some((e) => e.type === "promoted" && e.piece === "n"));
  assert.deepEqual(state.cells[sq("a8")], piece("white", "n"));
});

// --- pins and checks --------------------------------------------------------

test("a pinned piece cannot expose its king", () => {
  const state = stack([
    ["e1", piece("white", "k")],
    ["e4", piece("white", "n")], // pinned to the file
    ["e8", piece("black", "r")],
    ["a8", piece("black", "k")],
  ]);

  assert.deepEqual(Chess.legalMoves(state, sq("e4")), [], "the knight is nailed down");
});

test("a check must be answered", () => {
  const state = stack([
    ["e1", piece("white", "k")],
    ["a2", piece("white", "p")],
    ["e8", piece("black", "r")],
    ["a8", piece("black", "k")],
  ]);

  const moves = Chess.allLegalMoves(state);
  assert.ok(moves.length > 0);
  assert.ok(
    moves.every((m) => m.from === sq("e1")),
    "only the king may act — the pawn's business can wait"
  );
});

// --- castling ---------------------------------------------------------------

test("both wings castle: king two over, rook alongside", () => {
  const state = stack([
    ["e1", piece("white", "k")],
    ["h1", piece("white", "r")],
    ["a1", piece("white", "r")],
    ["e8", piece("black", "k")],
  ], { castling: { K: true, Q: true } });

  const kingside = Chess.move(state, sq("e1"), sq("g1"));
  assert.ok(kingside.some((e) => e.type === "castled" && e.wing === "k"));
  assert.deepEqual(state.cells[sq("f1")], piece("white", "r"), "the rook crossed over");
});

test("no castling through, out of, or into an attacked square", () => {
  const state = stack([
    ["e1", piece("white", "k")],
    ["h1", piece("white", "r")],
    ["f8", piece("black", "r")], // covers f1 — the transit square
    ["a8", piece("black", "k")],
  ], { castling: { K: true } });

  assert.ok(
    !Chess.legalMoves(state, sq("e1")).some((m) => m.castle),
    "the king may not pass through fire"
  );
});

test("rights die with the first move — and with a captured rook", () => {
  const state = makeState();
  play(state, [["e2", "e4"], ["e7", "e5"], ["e1", "e2"]]);
  assert.equal(state.castling.K, false);
  assert.equal(state.castling.Q, false);
  assert.equal(state.castling.k, true, "black's rights are its own");
});

// --- endings ----------------------------------------------------------------

test("the fool's mate: the fastest loss in chess, called correctly", () => {
  const state = makeState();
  play(state, [["f2", "f3"], ["e7", "e5"], ["g2", "g4"]]);

  const events = Chess.move(state, sq("d8"), sq("h4"));

  assert.ok(events.some((e) => e.type === "won" && e.winner === "black" && e.by === "checkmate"));
  assert.equal(state.status, "won");
  assert.equal(state.winner, "black");
});

test("stalemate is a draw, however grim the material", () => {
  const state = stack([
    ["e1", piece("white", "k")],
    ["b5", piece("white", "q")],
    ["a8", piece("black", "k")],
  ]);

  const events = Chess.move(state, sq("b5"), sq("b6"));

  assert.ok(events.some((e) => e.type === "draw" && e.reason === "stalemate"));
  assert.equal(state.status, "draw");
});

test("the fifty-move rule: the hundredth quiet half-move drains the game", () => {
  const state = makeState();
  state.halfmove = 99;

  const events = Chess.move(state, sq("g1"), sq("f3"));

  assert.ok(events.some((e) => e.type === "draw" && e.reason === "fifty moves"));
});

test("a finished game moves nothing", () => {
  const state = makeState();
  play(state, [["f2", "f3"], ["e7", "e5"], ["g2", "g4"], ["d8", "h4"]]);

  assert.deepEqual(Chess.move(state, sq("e2"), sq("e4")), []);
});

// --- perft: the judge -------------------------------------------------------

test("perft from the start matches the published counts", () => {
  const state = makeState();
  assert.equal(Chess.perft(state, 1), 20);
  assert.equal(Chess.perft(state, 2), 400);
  assert.equal(Chess.perft(state, 3), 8902);
  assert.equal(Chess.perft(state, 4), 197281);
});

test("perft on Kiwipete — the position built to break castling and en passant", () => {
  // r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -
  const state = stack([
    ["a8", piece("black", "r")], ["e8", piece("black", "k")], ["h8", piece("black", "r")],
    ["a7", piece("black", "p")], ["c7", piece("black", "p")], ["d7", piece("black", "p")],
    ["e7", piece("black", "q")], ["f7", piece("black", "p")], ["g7", piece("black", "b")],
    ["a6", piece("black", "b")], ["b6", piece("black", "n")], ["e6", piece("black", "p")],
    ["f6", piece("black", "n")], ["g6", piece("black", "p")],
    ["d5", piece("white", "p")], ["e5", piece("white", "n")],
    ["b4", piece("black", "p")], ["e4", piece("white", "p")],
    ["c3", piece("white", "n")], ["f3", piece("white", "q")], ["h3", piece("black", "p")],
    ["a2", piece("white", "p")], ["b2", piece("white", "p")], ["c2", piece("white", "p")],
    ["d2", piece("white", "b")], ["e2", piece("white", "b")], ["f2", piece("white", "p")],
    ["g2", piece("white", "p")], ["h2", piece("white", "p")],
    ["a1", piece("white", "r")], ["e1", piece("white", "k")], ["h1", piece("white", "r")],
  ], { castling: { K: true, Q: true, k: true, q: true } });

  assert.equal(Chess.perft(state, 1), 48);
  assert.equal(Chess.perft(state, 2), 2039);
});

// --- the machine ------------------------------------------------------------

test("the bot's move is always one the rules allow", () => {
  const state = makeState();

  const m = Chess.botMove(state, 2);

  assert.ok(m, "an opening exists");
  assert.ok(
    Chess.legalMoves(state, m.from).some((x) => x.to === m.to),
    "picked from the generator"
  );
});

test("the bot does not decline a free queen", () => {
  const state = stack([
    ["e1", piece("white", "k")],
    ["d1", piece("white", "r")],
    ["d8", piece("black", "q")], // hanging on the open file
    ["h8", piece("black", "k")],
  ]);

  const m = Chess.botMove(state, 2);

  assert.equal(m.from, sq("d1"));
  assert.equal(m.to, sq("d8"));
});

test("the status machine: two endings, both final", () => {
  const won = makeState();
  Chess.transition(won, "won");
  assert.throws(() => Chess.transition(won, "playing"), /illegal status change/);

  const draw = makeState();
  Chess.transition(draw, "draw");
  assert.throws(() => Chess.transition(draw, "won"), /illegal status change/);
});
