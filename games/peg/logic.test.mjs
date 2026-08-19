// ============================================================================
// Tests for the Peg Solitaire core — 1697, the court of Louis XIV, and
// now the oldest game in the catalog. One verb: jump a peg over its
// neighbor into an empty hole; the neighbor dies. Perfection is one peg,
// in the center. Two endings, and only your foresight decides which.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Peg from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const makeState = () => Peg.createState({ random: fakeRandom(0.5) });
const at = (r, c) => r * 7 + c;

test("the English cross: 33 holes, 32 pegs, the center empty", () => {
  const state = makeState();

  const holes = state.board.filter((c) => c !== null).length;
  const pegs = state.board.filter((c) => c === true).length;
  assert.equal(holes, 33);
  assert.equal(pegs, 32);
  assert.equal(state.board[at(3, 3)], false, "the empty heart");
  assert.equal(state.status, "playing");
});

test("a jump moves the peg and buries the one it vaulted", () => {
  const state = makeState();

  const events = Peg.jump(state, at(1, 3), at(3, 3)); // down over (2,3)

  assert.deepEqual(events, [{ type: "jumped" }]);
  assert.equal(state.board[at(1, 3)], false);
  assert.equal(state.board[at(2, 3)], false, "the vaulted peg is gone");
  assert.equal(state.board[at(3, 3)], true);
  assert.equal(state.pegs, 31);
});

test("illegal jumps bounce off: too far, no peg to vault, occupied landing", () => {
  const state = makeState();

  assert.deepEqual(Peg.jump(state, at(0, 3), at(3, 3)), [], "three is too far");
  assert.deepEqual(Peg.jump(state, at(1, 3), at(1, 5)), [], "landing occupied");
  Peg.jump(state, at(1, 3), at(3, 3));
  assert.deepEqual(Peg.jump(state, at(1, 3), at(3, 3)), [], "no peg at the start");
});

test("legalTargets lists exactly where a peg may go", () => {
  const state = makeState();

  assert.deepEqual(Peg.legalTargets(state, at(1, 3)), [at(3, 3)]);
  assert.deepEqual(Peg.legalTargets(state, at(0, 2)), [], "nowhere to land");
});

test("one peg left is the solve — in the center, the perfect one", () => {
  const state = makeState();
  state.board = state.board.map((c) => (c === null ? null : false));
  state.board[at(3, 5)] = true;
  state.board[at(3, 4)] = true;
  state.pegs = 2;

  const events = Peg.jump(state, at(3, 5), at(3, 3));

  assert.deepEqual(events, [
    { type: "jumped" },
    { type: "solved", pegs: 1, perfect: true },
  ]);
  assert.equal(state.status, "solved");
});

test("no moves left with pegs standing is being stuck", () => {
  const state = makeState();
  state.board = state.board.map((c) => (c === null ? null : false));
  state.board[at(3, 3)] = true;
  state.board[at(3, 4)] = true; // adjacent pair, nothing to land on... 
  state.board[at(3, 5)] = true; // three in a row: jumps blocked both ways
  state.pegs = 4; // one more, far away and alone
  state.board[at(0, 3)] = true;

  const events = Peg.jump(state, at(3, 5), at(3, 3));

  assert.deepEqual(events, [], "landing occupied — still stuck where we were");
  // Force the check the way play would: a legal jump that strands us.
  state.board[at(3, 3)] = false;
  state.pegs = 3;
  const ending = Peg.jump(state, at(3, 5), at(3, 3));
  assert.equal(ending[0].type, "jumped");
  assert.equal(ending[1].type, "stuck");
  assert.equal(state.status, "stuck");
});

test("finished boards accept no more jumps; step is a no-op", () => {
  const state = makeState();
  state.status = "stuck";
  assert.deepEqual(Peg.jump(state, at(1, 3), at(3, 3)), []);

  const fresh = makeState();
  assert.deepEqual(Peg.step(fresh), []);
});

test("the status machine: two endings, both final", () => {
  const state = makeState();
  Peg.transition(state, "solved");
  assert.throws(() => Peg.transition(state, "playing"), /illegal status change/);
});
