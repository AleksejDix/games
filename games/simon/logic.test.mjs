// ============================================================================
// Tests for the Simon core — written before the implementation. The
// smallest core in the catalog: a sequence and a finger on it. The shell
// owns all the timing (playback pacing); the core only judges.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Simon from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// 0.5 → every generated pad is floor(0.5 × 4) = 2.
const makeState = () => Simon.createState({ random: fakeRandom(0.5) });

test("a new game: a one-note sequence, nothing repeated yet", () => {
  const state = makeState();

  assert.deepEqual(state.sequence, [2]);
  assert.equal(state.progress, 0);
  assert.equal(state.score, 0);
  assert.equal(state.status, "playing");
});

test("a correct press advances the finger", () => {
  const state = makeState();
  state.sequence = [1, 3];

  const events = Simon.press(state, 1);

  assert.deepEqual(events, [{ type: "pressed", pad: 1 }]);
  assert.equal(state.progress, 1);
});

test("finishing the sequence completes the round and scores it", () => {
  const state = makeState();
  state.sequence = [1, 3];
  Simon.press(state, 1);

  const events = Simon.press(state, 3);

  assert.deepEqual(events, [
    { type: "pressed", pad: 3 },
    { type: "roundComplete", round: 2 },
  ]);
  assert.equal(state.score, 2);
});

test("extend() adds a note and rewinds the finger", () => {
  const state = makeState();
  state.sequence = [1, 3];
  state.progress = 2;

  const events = Simon.extend(state);

  assert.deepEqual(events, [{ type: "extended" }]);
  assert.equal(state.sequence.length, 3);
  assert.equal(state.progress, 0);
});

test("one wrong note ends the game", () => {
  const state = makeState();
  state.sequence = [1, 3];

  const events = Simon.press(state, 0);

  assert.deepEqual(events, [
    { type: "pressed", pad: 0 },
    { type: "died", round: 1 },
  ]);
  assert.equal(state.status, "gameover");
});

test("a finished game hears nothing", () => {
  const state = makeState();
  state.status = "gameover";

  assert.deepEqual(Simon.press(state, 0), []);
  assert.deepEqual(Simon.extend(state), []);
});

test("step() is an honest no-op", () => {
  const state = makeState();

  assert.deepEqual(Simon.step(state), []);
  assert.equal(state.progress, 0);
});

test("the status machine: one wrong note is the only exit", () => {
  const state = makeState();

  Simon.transition(state, "gameover");

  assert.throws(() => Simon.transition(state, "playing"), /illegal status change/);
});
