// ============================================================================
// Tests for the Connect Four core. The rules under test are the 1974
// original's load-bearing ones: you pick a COLUMN and gravity picks the
// cell, a full column refuses, four in a row in any direction ends it,
// and a full rack with no line is a draw. Boards are built with real
// drops wherever a game could reach them; row 0 is the top of the rack.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Connect from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const idx = (r, c) => r * Connect.COLS + c;

function makeState() {
  return Connect.createState({ random: fakeRandom(0.5) });
}

// Play out a column sequence, alternating sides from red — the games
// build their positions the way players do, one drop at a time.
function play(state, cols) {
  let events = [];
  for (const col of cols) events = Connect.drop(state, col);
  return events; // the LAST drop's events — the one the test cares about
}

// A cleared rack with discs placed by hand: [r, c, side][] — for bot
// positions, where the path there doesn't matter.
function fill(placements, turn) {
  const state = makeState();
  for (const [r, c, side] of placements) state.cells[idx(r, c)] = side;
  state.turn = turn;
  return state;
}

// --- setup ------------------------------------------------------------------

test("a new game: 42 empty cells, red to drop", () => {
  const state = makeState();

  assert.equal(state.cells.length, 42);
  assert.ok(state.cells.every((cell) => cell === null));
  assert.equal(state.turn, "red");
  assert.equal(state.winner, null);
  assert.equal(state.line, null);
  assert.equal(state.status, "playing");
});

// --- gravity ----------------------------------------------------------------

test("discs stack from the bottom, and the turn passes", () => {
  const state = makeState();

  const first = Connect.drop(state, 3);
  assert.deepEqual(first, [{ type: "dropped", col: 3, index: idx(5, 3), side: "red" }]);
  assert.equal(state.turn, "gold");

  const second = Connect.drop(state, 3);
  assert.equal(second[0].index, idx(4, 3), "the second disc rests on the first");
  assert.equal(state.cells[idx(4, 3)], "gold");
  assert.equal(state.turn, "red");
});

test("a full column refuses the seventh disc", () => {
  const state = makeState();
  play(state, [2, 2, 2, 2, 2, 2]); // six discs: the column is packed

  assert.deepEqual(Connect.drop(state, 2), []);
  assert.equal(state.turn, "red", "a refused drop burns nothing");
});

test("an off-board column refuses too — the core is a public API", () => {
  const state = makeState();
  assert.deepEqual(Connect.drop(state, -1), []);
  assert.deepEqual(Connect.drop(state, 7), []);
  assert.deepEqual(Connect.drop(state, 3.5), []);
});

// --- the four-in-a-row ------------------------------------------------------

test("four across wins, and the win carries its line", () => {
  const state = makeState();
  // Red walks the bottom row while gold stacks a corner.
  const events = play(state, [0, 6, 1, 6, 2, 6, 3]);

  const won = events.find((e) => e.type === "won");
  assert.ok(won, "the fourth disc ends it");
  assert.equal(won.winner, "red");
  assert.deepEqual(won.line, [idx(5, 0), idx(5, 1), idx(5, 2), idx(5, 3)]);
  assert.deepEqual(state.line, won.line, "the renderer reads the same four");
  assert.equal(state.status, "won");
  assert.equal(state.winner, "red");
});

test("four up a column wins", () => {
  const state = makeState();
  const events = play(state, [0, 6, 0, 5, 0, 4, 0]);

  assert.ok(events.some((e) => e.type === "won" && e.winner === "red"));
  assert.deepEqual(state.line, [idx(2, 0), idx(3, 0), idx(4, 0), idx(5, 0)]);
});

test("four on the diagonal wins", () => {
  const state = makeState();
  // Red builds the staircase (5,0)-(4,1)-(3,2)-(2,3); gold's drops are
  // the steps red climbs.
  const events = play(state, [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]);

  assert.ok(events.some((e) => e.type === "won" && e.winner === "red"));
  assert.deepEqual(state.line, [idx(2, 3), idx(3, 2), idx(4, 1), idx(5, 0)]);
});

// --- the draw ---------------------------------------------------------------

test("a full rack with no line is a draw", () => {
  // A real drawn game, found by letting two random players fill the
  // rack — every drop below was legal and none of them won.
  const drawnGame = [2, 3, 1, 2, 2, 0, 4, 0, 0, 0, 6, 0, 3, 1, 6, 3, 6, 6, 5, 0, 2,
                     6, 1, 2, 3, 3, 2, 5, 5, 4, 6, 4, 4, 5, 4, 1, 4, 5, 1, 5, 1];
  const state = makeState();
  play(state, drawnGame);
  assert.equal(state.status, "playing", "41 discs down, one cell left");

  const events = Connect.drop(state, 3);

  assert.ok(events.some((e) => e.type === "draw"));
  assert.equal(state.status, "draw");
  assert.equal(state.winner, null);
});

// --- endings ----------------------------------------------------------------

test("a finished game refuses every drop", () => {
  const state = makeState();
  play(state, [0, 6, 1, 6, 2, 6, 3]); // red wins across the bottom

  assert.deepEqual(Connect.drop(state, 4), []);
  assert.equal(state.cells[idx(5, 4)], null, "the rack is frozen");
});

// --- the machine's discs ----------------------------------------------------

test("the bot blocks an immediate opponent win", () => {
  // Red threatens the bottom row; gold to move. Any other column loses
  // on the spot, and the search knows it.
  const state = fill(
    [[5, 0, "red"], [5, 1, "red"], [5, 2, "red"], [4, 1, "gold"], [4, 2, "gold"]],
    "gold"
  );

  assert.equal(Connect.botMove(state), 3);
});

test("the bot takes its own immediate win over a mere block", () => {
  // Both colors threaten column 3 — but gold moves, and winning now
  // beats worrying about red's row above.
  const state = fill(
    [
      [5, 4, "gold"], [5, 5, "gold"], [5, 6, "gold"],
      [4, 4, "red"], [4, 5, "red"], [4, 6, "red"], [5, 0, "red"],
    ],
    "gold"
  );

  const col = Connect.botMove(state);
  const events = Connect.drop(state, col);

  assert.equal(col, 3);
  assert.ok(events.some((e) => e.type === "won" && e.winner === "gold"));
});

// --- the machine ------------------------------------------------------------

test("the status machine: two endings, both final", () => {
  const won = makeState();
  Connect.transition(won, "won");
  assert.throws(() => Connect.transition(won, "playing"), /illegal status change/);

  const draw = makeState();
  Connect.transition(draw, "draw");
  assert.throws(() => Connect.transition(draw, "won"), /illegal status change/);
});
