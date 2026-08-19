// ============================================================================
// Tests for the Whac-a-Mole core — written before the implementation.
// The 1976 carnival cabinet: moles pop on the clock, duck on their own,
// and only the timer ever wins. whack() is a pointer ACTION; step() is
// the clocked world (pops and ducks and the countdown).
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Whac from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// 0.5 never beats the pop chance — a quiet lawn unless a test scripts it.
const makeState = () => Whac.createState({ random: fakeRandom(0.5) });

test("a new game: nine empty holes and a full clock", () => {
  const state = makeState();

  assert.equal(state.holes.length, 9);
  assert.ok(state.holes.every((h) => h === 0));
  assert.equal(state.time, Whac.WHAC.time);
  assert.equal(state.score, 0);
  assert.equal(state.status, "playing");
});

test("a mole pops into a free hole, for a bounded stay", () => {
  const state = makeState();
  state.random = fakeRandom(0.0001, 0.3); // chance roll, then hole pick

  const events = Whac.step(state);

  assert.deepEqual(events, [{ type: "popped" }]);
  assert.equal(state.holes.filter(Boolean).length, 1);
  assert.ok(Math.max(...state.holes) <= Whac.WHAC.upTicks);
});

test("an unwhacked mole ducks by itself", () => {
  const state = makeState();
  state.holes[4] = 1; // one tick from ducking

  Whac.step(state);

  assert.equal(state.holes[4], 0);
});

test("whacking an up mole scores and empties the hole", () => {
  const state = makeState();
  state.holes[4] = 100;

  const events = Whac.whack(state, 4);

  assert.deepEqual(events, [{ type: "whacked", index: 4 }]);
  assert.equal(state.holes[4], 0);
  assert.equal(state.score, Whac.WHAC.points);
});

test("whacking an empty hole is a whiff — free, but audible", () => {
  const state = makeState();

  const events = Whac.whack(state, 4);

  assert.deepEqual(events, [{ type: "whiffed" }]);
  assert.equal(state.score, 0);
});

test("the clock runs down and ends the round", () => {
  const state = makeState();
  state.time = 0.001;

  const events = Whac.step(state);

  assert.deepEqual(events, [{ type: "timeUp" }]);
  assert.equal(state.status, "gameover");
});

test("after time, mallets are useless", () => {
  const state = makeState();
  state.status = "gameover";
  state.holes[4] = 100;

  assert.deepEqual(Whac.whack(state, 4), []);
  assert.deepEqual(Whac.step(state), []);
});

test("the status machine: only the clock ends it", () => {
  const state = makeState();

  Whac.transition(state, "gameover");

  assert.throws(() => Whac.transition(state, "playing"), /illegal status change/);
});
