// ============================================================================
// Tests for the Reversi core. The rules under test are the 1883 game's
// load-bearing ones: a placement must FLANK, everything bracketed flips
// (all directions at once), a stuck side passes rather than loses, and
// only a board neither side can touch gets counted. Boards are
// hand-stacked; row 0 is the top rank.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Reversi from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const idx = (r, c) => r * Reversi.SIZE + c;

function makeState() {
  return Reversi.createState({ random: fakeRandom(0.5) });
}

// A cleared board with discs placed by hand: [r, c, side][]
function stack(placements, turn = "black") {
  const state = makeState();
  state.cells = Array(Reversi.SIZE * Reversi.SIZE).fill(null);
  for (const [r, c, side] of placements) state.cells[idx(r, c)] = side;
  state.turn = turn;
  return state;
}

// --- setup ------------------------------------------------------------------

test("a new game: four discs crossed in the center, black to move", () => {
  const state = makeState();

  assert.equal(state.cells.filter((d) => d !== null).length, 4);
  assert.equal(state.cells[idx(3, 3)], "white");
  assert.equal(state.cells[idx(4, 4)], "white");
  assert.equal(state.cells[idx(3, 4)], "black");
  assert.equal(state.cells[idx(4, 3)], "black");
  assert.equal(state.turn, "black");
  assert.equal(state.status, "playing");

  // The four classic openings, and nothing else.
  assert.deepEqual(Reversi.legalPlacements(state).sort((a, b) => a - b), [
    idx(2, 3),
    idx(3, 2),
    idx(4, 5),
    idx(5, 4),
  ]);
});

// --- the flank --------------------------------------------------------------

test("a placement flips the bracketed line — every direction at once", () => {
  const state = stack([
    [3, 1, "black"],
    [3, 2, "white"], // the row: (3,3) over (3,2) to (3,1)
    [1, 3, "black"],
    [2, 3, "white"], // the column: (3,3) over (2,3) to (1,3)
    [6, 4, "white"],
    [6, 5, "black"], // a pocket that keeps white in the game
  ]);

  const events = Reversi.place(state, idx(3, 3));

  assert.deepEqual(events[0], { type: "placed", index: idx(3, 3), side: "black" });
  const flipped = events.find((e) => e.type === "flipped");
  assert.deepEqual(flipped.indices.sort((a, b) => a - b), [idx(2, 3), idx(3, 2)]);
  assert.equal(state.cells[idx(3, 2)], "black");
  assert.equal(state.cells[idx(2, 3)], "black");
  assert.equal(state.turn, "white", "the turn passed");
  assert.ok(!events.some((e) => e.type === "passed"));
});

test("a placement that flips nothing is refused — occupied squares too", () => {
  const state = makeState();

  assert.deepEqual(Reversi.place(state, idx(0, 0)), [], "no flank, no move");
  assert.deepEqual(Reversi.place(state, idx(3, 3)), [], "the square is taken");
  assert.equal(state.turn, "black", "and the turn never moved");
});

// --- the pass ---------------------------------------------------------------

test("a stuck opponent passes: the event fires and the turn comes back", () => {
  const state = stack([
    [3, 0, "black"],
    [3, 1, "white"], // black's move: (3,2) flips white's last mobile disc
    [6, 5, "white"], // a white disc with no line to play on...
    [6, 6, "black"],
    [6, 7, "black"], // ...and black can still take it at (6,4)
  ]);

  const events = Reversi.place(state, idx(3, 2));

  assert.ok(events.some((e) => e.type === "passed" && e.side === "white"));
  assert.equal(state.turn, "black", "the turn returned");
  assert.equal(state.status, "playing", "the game goes on");
});

test("both sides stuck ends the game with the count", () => {
  const state = stack([
    [0, 0, "black"],
    [0, 1, "white"], // the last white disc — flipping it starves the board
  ]);

  const events = Reversi.place(state, idx(0, 2));

  const won = events.find((e) => e.type === "won");
  assert.deepEqual(won, { type: "won", winner: "black", black: 3, white: 0 });
  assert.equal(state.status, "won");
  assert.equal(state.winner, "black");
});

// --- endings ----------------------------------------------------------------

test("filling the board ends the game", () => {
  const state = makeState();
  state.cells = Array(Reversi.SIZE * Reversi.SIZE).fill("black");
  state.cells[0] = null;
  state.cells[1] = "white";
  state.turn = "black";

  const events = Reversi.place(state, 0);

  assert.ok(events.some((e) => e.type === "won" && e.winner === "black" && e.black === 64));
  assert.equal(state.status, "won");
  assert.ok(state.cells.every((d) => d !== null), "no square left");
});

test("an even count is a draw", () => {
  // Full board, one gap: black's last move flips exactly one disc and
  // the count lands 32 : 32.
  const state = makeState();
  state.cells = Array(Reversi.SIZE * Reversi.SIZE).fill(null);
  state.cells[1] = "white";
  state.cells[2] = "black"; // seals the row so only (0,1) flips
  state.cells[8] = "black"; // stops the column cold
  state.cells[9] = "black"; // stops the diagonal cold
  let blacks = 27; // 30 black + 33 white before the move → 32 : 32 after
  for (let i = 3; i < state.cells.length; i++) {
    if (state.cells[i] === null) state.cells[i] = blacks-- > 0 ? "black" : "white";
  }
  state.turn = "black";

  const events = Reversi.place(state, 0);

  assert.deepEqual(events.find((e) => e.type === "draw"), { type: "draw", black: 32, white: 32 });
  assert.equal(state.status, "draw");
});

test("a finished game places nothing", () => {
  const state = stack([
    [0, 0, "black"],
    [0, 1, "white"],
  ]);
  Reversi.place(state, idx(0, 2)); // black wins

  assert.deepEqual(Reversi.place(state, idx(5, 5)), []);
});

// --- the generator ----------------------------------------------------------

test("legalPlacements and place() agree on every square", () => {
  const legal = Reversi.legalPlacements(makeState());

  for (let i = 0; i < Reversi.SIZE * Reversi.SIZE; i++) {
    const accepted = Reversi.place(makeState(), i).length > 0;
    assert.equal(accepted, legal.includes(i), `square ${i}`);
  }
});

// --- the machine ------------------------------------------------------------

test("the AI's move is always one the rules allow", () => {
  const state = makeState();

  const m = Reversi.botMove(state, 3);

  assert.ok(Reversi.legalPlacements(state).includes(m), "the search picked from the generator");
});

test("the AI takes the corner when offered", () => {
  const state = stack([
    [0, 1, "white"],
    [0, 2, "black"], // the corner line: (0,0) is on the table
    [5, 5, "white"],
    [5, 6, "black"], // a plain alternative at (5,4)
  ]);

  assert.equal(Reversi.botMove(state, 4), idx(0, 0), "corners are forever");
});

test("the status machine: both endings are final", () => {
  const won = makeState();
  Reversi.transition(won, "won");
  assert.throws(() => Reversi.transition(won, "playing"), /illegal status change/);

  const drawn = makeState();
  Reversi.transition(drawn, "draw");
  assert.throws(() => Reversi.transition(drawn, "won"), /illegal status change/);
});
