// ============================================================================
// Tests for the Checkers core. The rules under test are English
// draughts' load-bearing ones: captures are FORCED, chains must run
// their course, the crown ends the move, and a side with nothing to
// play has lost. Boards are hand-stacked; row 0 is white's home rank.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Checkers from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const idx = (r, c) => r * Checkers.SIZE + c;
const man = (side) => ({ side, king: false });
const king = (side) => ({ side, king: true });

function makeState() {
  return Checkers.createState({ random: fakeRandom(0.5) });
}

// A cleared board with pieces placed by hand: [r, c, piece][]
function stack(placements, turn = "red") {
  const state = makeState();
  state.cells = Array(Checkers.SIZE * Checkers.SIZE).fill(null);
  for (const [r, c, piece] of placements) state.cells[idx(r, c)] = piece;
  state.turn = turn;
  return state;
}

// --- setup ------------------------------------------------------------------

test("a new game: twelve men a side, dark squares only, red to move", () => {
  const state = makeState();

  const red = state.cells.filter((p) => p?.side === "red");
  const white = state.cells.filter((p) => p?.side === "white");
  assert.equal(red.length, 12);
  assert.equal(white.length, 12);
  assert.ok(red.every((p) => !p.king) && white.every((p) => !p.king));
  state.cells.forEach((p, i) => {
    if (p) {
      assert.ok(
        Checkers.playable(Math.floor(i / Checkers.SIZE), i % Checkers.SIZE),
        `piece on a light square at ${i}`
      );
    }
  });
  assert.equal(state.turn, "red");
  assert.equal(state.status, "playing");
});

// --- plain moves ------------------------------------------------------------

test("a man steps diagonally forward, and the turn passes", () => {
  const state = stack([[5, 2, man("red")], [0, 1, man("white")]]);

  const events = Checkers.move(state, idx(5, 2), idx(4, 1));

  assert.equal(events[0].type, "moved");
  assert.equal(state.cells[idx(4, 1)].side, "red");
  assert.equal(state.cells[idx(5, 2)], null);
  assert.equal(state.turn, "white");
});

test("a man never steps backward; a king owns both directions", () => {
  const m = stack([[5, 2, man("red")], [0, 1, man("white")]]);
  assert.deepEqual(Checkers.move(m, idx(5, 2), idx(6, 1)), [], "no retreat for men");

  const k = stack([[5, 2, king("red")], [0, 1, man("white")]]);
  const events = Checkers.move(k, idx(5, 2), idx(6, 1));
  assert.equal(events[0].type, "moved", "the crown moves backward freely");
});

// --- the forced capture -----------------------------------------------------

test("an available jump outlaws every quiet move", () => {
  const state = stack([
    [5, 2, man("red")],
    [4, 3, man("white")], // jumpable: (5,2) over (4,3) lands (3,4)
    [7, 0, man("red")], // this one has quiet moves — but not today
  ]);

  assert.deepEqual(Checkers.legalMoves(state, idx(7, 0)), [], "the other piece is frozen");
  assert.deepEqual(Checkers.move(state, idx(5, 2), idx(4, 1)), [], "the quiet step is refused");

  const events = Checkers.move(state, idx(5, 2), idx(3, 4));
  assert.ok(events.some((e) => e.type === "captured"), "the jump goes through");
  assert.equal(state.cells[idx(4, 3)], null, "and the man is off the board");
});

test("a chain keeps the turn and locks the board to the jumping piece", () => {
  const state = stack([
    [5, 2, man("red")],
    [4, 3, man("white")],
    [2, 3, man("white")], // second victim: (3,4) over (2,3) lands (1,2)
    [7, 0, man("red")],
    [0, 7, man("white")], // a bystander, so the game doesn't end
  ]);

  const first = Checkers.move(state, idx(5, 2), idx(3, 4));
  assert.ok(first.some((e) => e.type === "chain"), "the jump must continue");
  assert.equal(state.turn, "red", "the turn has not passed");
  assert.deepEqual(Checkers.legalMoves(state, idx(7, 0)), [], "only the chained piece may move");

  const second = Checkers.move(state, idx(3, 4), idx(1, 2));
  assert.ok(second.some((e) => e.type === "captured"));
  assert.equal(state.turn, "white", "the chain ran dry and the turn passed");
  assert.equal(state.cells.filter((p) => p?.side === "white").length, 1);
});

// --- the crown --------------------------------------------------------------

test("the back rank crowns", () => {
  const state = stack([[1, 2, man("red")], [7, 6, man("white")]]);

  const events = Checkers.move(state, idx(1, 2), idx(0, 1));

  assert.ok(events.some((e) => e.type === "crowned"));
  assert.ok(state.cells[idx(0, 1)].king);
});

test("crowning ENDS the move — even a chain that could continue", () => {
  const state = stack([
    [2, 1, man("red")],
    [1, 2, man("white")], // the jump lands on the back rank: (0,3)
    [1, 4, man("white")], // a fresh king COULD jump this... but the crown ends it
  ]);

  const events = Checkers.move(state, idx(2, 1), idx(0, 3));

  assert.ok(events.some((e) => e.type === "crowned"));
  assert.ok(!events.some((e) => e.type === "chain"), "no chain past the crown");
  assert.equal(state.turn, "white", "the move is over — that IS the rule");
});

// --- endings ----------------------------------------------------------------

test("capturing the last piece wins", () => {
  const state = stack([[5, 2, man("red")], [4, 3, man("white")]]);

  const events = Checkers.move(state, idx(5, 2), idx(3, 4));

  assert.ok(events.some((e) => e.type === "won" && e.winner === "red"));
  assert.equal(state.status, "won");
  assert.equal(state.winner, "red");
});

test("a side with pieces but no moves has lost", () => {
  const state = stack([
    [0, 1, man("white")], // both steps blocked, no landing to jump to
    [1, 0, man("red")],
    [1, 2, man("red")],
    [2, 3, man("red")],
    [5, 0, man("red")], // red passes the turn with an innocent step
  ]);

  const events = Checkers.move(state, idx(5, 0), idx(4, 1));

  assert.ok(events.some((e) => e.type === "won" && e.winner === "red"), "blocked is lost");
  assert.equal(state.status, "won");
});

test("a finished game moves nothing", () => {
  const state = stack([[5, 2, man("red")], [4, 3, man("white")]]);
  Checkers.move(state, idx(5, 2), idx(3, 4)); // red wins

  assert.deepEqual(Checkers.move(state, idx(3, 4), idx(2, 5)), []);
});

// --- the machine ------------------------------------------------------------

test("the AI's move is always one the rules allow", () => {
  const state = makeState();

  const m = Checkers.botMove(state, 3);

  assert.ok(m, "an opening exists");
  assert.ok(
    Checkers.legalMoves(state, m.from).some((x) => x.to === m.to),
    "and the search picked from the generator"
  );
});

test("the AI takes the winning capture", () => {
  const state = stack(
    [[3, 4, man("white")], [4, 3, man("red")]],
    "white"
  ); // white jumps (3,4) over (4,3) → (5,2), clearing the board

  const m = Checkers.botMove(state, 3);
  const events = Checkers.move(state, m.from, m.to);

  assert.ok(events.some((e) => e.type === "won" && e.winner === "white"));
});

test("the status machine: one ending, and it is final", () => {
  const state = makeState();
  Checkers.transition(state, "won");
  assert.throws(() => Checkers.transition(state, "playing"), /illegal status change/);
});
