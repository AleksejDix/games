// ============================================================================
// Tests for the Memory core — written before the implementation.
//
// Pelmanism, the Victorian parlor classic: every card is face-down, and
// the state the game is really about lives in YOUR head. The core's new
// idea is hidden state with a settling rule: a mismatched pair stays up
// until the next flip (or until the shell's timer calls settle() — time
// stays in the shell, as always). Moves count pair ATTEMPTS; fewest wins.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Memory from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

function makeState() {
  return Memory.createState({ random: fakeRandom(0.5) });
}

// A hand-stacked deck: values in the given order, all face down.
const stack = (values) =>
  values.map((value) => ({ value, faceUp: false, matched: false }));

// --- setup ------------------------------------------------------------------

test("a new game: every value exactly twice, all face down", () => {
  const state = makeState();

  assert.equal(state.cards.length, 16); // 8 pairs, the classic
  assert.ok(state.cards.every((c) => !c.faceUp && !c.matched));
  const counts = {};
  for (const c of state.cards) counts[c.value] = (counts[c.value] ?? 0) + 1;
  assert.ok(Object.values(counts).every((n) => n === 2));
  assert.equal(state.moves, 0);
  assert.equal(state.status, "playing");
});

test("createState accepts a pair count", () => {
  const state = Memory.createState({ random: fakeRandom(0.5), pairs: 6 });

  assert.equal(state.cards.length, 12);
});

// --- flipping -----------------------------------------------------------------

test("a flip turns a card up and tells its value", () => {
  const state = makeState();
  state.cards = stack([1, 2, 1, 2]);

  const events = Memory.flip(state, 0);

  assert.deepEqual(events, [{ type: "flipped", index: 0, value: 1 }]);
  assert.ok(state.cards[0].faceUp);
  assert.equal(state.moves, 0, "one card up is not yet an attempt");
});

test("flipping the same card again does nothing", () => {
  const state = makeState();
  state.cards = stack([1, 2, 1, 2]);
  Memory.flip(state, 0);

  assert.deepEqual(Memory.flip(state, 0), []);
});

test("a mismatched pair stays up, and the attempt is counted", () => {
  const state = makeState();
  state.cards = stack([1, 2, 1, 2]);
  Memory.flip(state, 0);

  const events = Memory.flip(state, 1);

  assert.deepEqual(events, [
    { type: "flipped", index: 1, value: 2 },
    { type: "mismatched" },
  ]);
  assert.equal(state.moves, 1);
  assert.ok(state.cards[0].faceUp && state.cards[1].faceUp, "both linger");
});

test("settle() turns a lingering mismatch back down", () => {
  const state = makeState();
  state.cards = stack([1, 2, 1, 2]);
  Memory.flip(state, 0);
  Memory.flip(state, 1);

  const events = Memory.settle(state);

  assert.deepEqual(events, [{ type: "settled" }]);
  assert.ok(!state.cards[0].faceUp && !state.cards[1].faceUp);
  assert.deepEqual(Memory.settle(state), [], "nothing left to settle");
});

test("the next flip settles a lingering mismatch by itself", () => {
  const state = makeState();
  state.cards = stack([1, 2, 1, 2]);
  Memory.flip(state, 0);
  Memory.flip(state, 1); // mismatch lingers

  const events = Memory.flip(state, 2);

  assert.deepEqual(events, [
    { type: "settled" },
    { type: "flipped", index: 2, value: 1 },
  ]);
  assert.ok(!state.cards[0].faceUp && !state.cards[1].faceUp);
  assert.ok(state.cards[2].faceUp);
});

test("a matched pair locks face up and reports what remains", () => {
  const state = makeState();
  state.cards = stack([1, 2, 1, 2]);
  Memory.flip(state, 0);

  const events = Memory.flip(state, 2);

  assert.deepEqual(events, [
    { type: "flipped", index: 2, value: 1 },
    { type: "matched", value: 1, remaining: 1 },
  ]);
  assert.ok(state.cards[0].matched && state.cards[2].matched);
});

test("the last pair solves the game, with the attempt count", () => {
  const state = makeState();
  state.cards = stack([1, 2, 1, 2]);
  Memory.flip(state, 0);
  Memory.flip(state, 2); // 1-1 matched
  Memory.flip(state, 1);

  const events = Memory.flip(state, 3);

  assert.deepEqual(events, [
    { type: "flipped", index: 3, value: 2 },
    { type: "matched", value: 2, remaining: 0 },
    { type: "solved", moves: 2 },
  ]);
  assert.equal(state.status, "solved");
});

test("a solved game flips nothing", () => {
  const state = makeState();
  state.status = "solved";

  assert.deepEqual(Memory.flip(state, 0), []);
});

// --- the turn-based contract ------------------------------------------------------

test("step() is an honest no-op", () => {
  const state = makeState();

  assert.deepEqual(Memory.step(state), []);
  assert.equal(state.moves, 0);
});

test("the status machine: solved is the only exit, and it is final", () => {
  const state = makeState();

  Memory.transition(state, "solved");

  assert.throws(
    () => Memory.transition(state, "playing"),
    /illegal status change/
  );
});
