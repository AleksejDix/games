// ============================================================================
// Tests for the OXO core — written before the implementation.
//
// Noughts and crosses, as the Cambridge EDSAC drew it in 1952 — arguably
// the first graphical computer game ever made. The new idea is MINIMAX:
// the AI searches the whole game tree and plays perfectly. That claim is
// not vibes — the flagship test below plays EVERY possible human strategy
// against it and counts the losses. There must be none.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Oxo from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

function makeState(cells) {
  const state = Oxo.createState({ random: fakeRandom(0.5) });
  if (cells) state.cells = [...cells];
  return state;
}

const _ = null;

// --- setup ------------------------------------------------------------------

test("a new game: an empty board, X to move", () => {
  const state = makeState();

  assert.deepEqual(state.cells, Array(9).fill(null));
  assert.equal(state.turn, "X");
  assert.equal(state.status, "playing");
});

// --- placing -----------------------------------------------------------------

test("placing marks the cell and passes the turn", () => {
  const state = makeState();

  const events = Oxo.place(state, 4);

  assert.deepEqual(events, [{ type: "placed", mark: "X", index: 4 }]);
  assert.equal(state.cells[4], "X");
  assert.equal(state.turn, "O");
});

test("an occupied cell refuses politely", () => {
  const state = makeState();
  Oxo.place(state, 4);

  assert.deepEqual(Oxo.place(state, 4), []);
  assert.equal(state.turn, "O", "the turn did not pass");
});

test("a place outside the board refuses too", () => {
  // Regression: cells[9] read undefined (falsy), slipped past the
  // occupied check, appended a tenth cell, and burned the turn.
  const state = makeState();

  assert.deepEqual(Oxo.place(state, 9), []);
  assert.deepEqual(Oxo.place(state, -1), []);
  assert.equal(state.cells.length, 9, "the board did not grow");
  assert.equal(state.turn, "X", "the turn did not pass");
});

test("three in a row wins, with the line as data", () => {
  const state = makeState(["X", "X", _, "O", "O", _, _, _, _]);

  const events = Oxo.place(state, 2);

  assert.deepEqual(events, [
    { type: "placed", mark: "X", index: 2 },
    { type: "won", mark: "X", line: [0, 1, 2] },
  ]);
  assert.equal(state.status, "won");
  assert.equal(state.winner, "X");
});

test("a full board with no line is a draw", () => {
  // X X O / O O X / X _ O — X plays the last cell: no line anywhere.
  const state = makeState(["X", "X", "O", "O", "O", "X", "X", _, "O"]);

  const events = Oxo.place(state, 7);

  assert.deepEqual(events, [
    { type: "placed", mark: "X", index: 7 },
    { type: "draw" },
  ]);
  assert.equal(state.status, "draw");
});

test("a finished game accepts no more marks", () => {
  const state = makeState(["X", "X", _, "O", "O", _, _, _, _]);
  Oxo.place(state, 2); // X wins

  assert.deepEqual(Oxo.place(state, 8), []);
});

// --- the perfect opponent -------------------------------------------------------

test("the AI takes a win when one is on the table", () => {
  const state = makeState(["O", "O", _, "X", "X", _, _, _, _]);
  state.turn = "O";

  assert.equal(Oxo.aiMove(state), 2, "completes its own line");
});

test("the AI blocks the guillotine", () => {
  const state = makeState(["X", "X", _, _, "O", _, _, _, _]);
  state.turn = "O";

  assert.equal(Oxo.aiMove(state), 2, "blocks X's finishing move");
});

test("THE test: minimax never loses — proven over every human strategy", () => {
  // X (the human) tries every legal move at every turn; O always answers
  // with aiMove. Exhaustive over the whole tree: X must never win.
  let games = 0;
  let xWins = 0;

  function explore(state) {
    for (let i = 0; i < 9; i++) {
      if (state.cells[i]) continue;
      const s = { ...state, cells: [...state.cells] };
      Oxo.place(s, i); // the human tries this
      if (s.status !== "playing") {
        games++;
        if (s.winner === "X") xWins++;
        continue;
      }
      Oxo.place(s, Oxo.aiMove(s)); // the machine answers
      if (s.status !== "playing") {
        games++;
        if (s.winner === "X") xWins++;
      } else {
        explore(s);
      }
    }
  }

  explore(makeState());

  assert.ok(games > 500, `explored ${games} finished games`);
  assert.equal(xWins, 0, `the AI lost ${xWins} of ${games} games`);
});

// --- the turn-based contract ------------------------------------------------------

test("step() is an honest no-op", () => {
  const state = makeState();

  assert.deepEqual(Oxo.step(state), []);
  assert.equal(state.turn, "X");
});

test("the status machine: two endings, both final", () => {
  const won = makeState();
  Oxo.transition(won, "won");
  assert.throws(() => Oxo.transition(won, "playing"), /illegal status change/);

  const draw = makeState();
  Oxo.transition(draw, "draw");
  assert.throws(() => Oxo.transition(draw, "playing"), /illegal status change/);
});
