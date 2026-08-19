// ============================================================================
// Tests for the Lights Out core — written before the implementation.
// Tapping a cell toggles it AND its orthogonal neighbors; the goal is
// all-dark. Scrambles are random presses from the solved board, so every
// puzzle is solvable by construction (the Fifteen lesson). Bonus lore:
// the game is linear algebra over GF(2) — every board is a sum of
// presses, and press order never matters.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Lights from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const makeState = () => Lights.createState({ random: fakeRandom(0.3, 0.7, 0.1) });

test("a new game: a 5×5 board, scrambled but never born solved", () => {
  const state = makeState();

  assert.equal(state.grid.length, 25);
  assert.ok(state.grid.some(Boolean), "some lights are on");
  assert.equal(state.moves, 0);
  assert.equal(state.status, "playing");
});

test("a press toggles the cross: the cell and its four neighbors", () => {
  const state = makeState();
  state.grid = Array(25).fill(false);

  const events = Lights.toggle(state, 12); // dead center

  assert.deepEqual(events, [{ type: "toggled", index: 12 }]);
  for (const i of [12, 11, 13, 7, 17]) assert.ok(state.grid[i], `cell ${i}`);
  assert.equal(state.grid.filter(Boolean).length, 5);
  assert.equal(state.moves, 1);
});

test("corners toggle only what exists", () => {
  const state = makeState();
  state.grid = Array(25).fill(false);

  Lights.toggle(state, 0);

  assert.equal(state.grid.filter(Boolean).length, 3); // 0, 1, 5
});

test("pressing twice undoes — GF(2) in action", () => {
  const state = makeState();
  state.grid = Array(25).fill(false);

  Lights.toggle(state, 12);
  Lights.toggle(state, 12);

  assert.ok(state.grid.every((c) => !c));
  assert.equal(state.moves, 2, "but both presses still cost");
});

test("darkness is victory", () => {
  const state = makeState();
  state.grid = Array(25).fill(false);
  Lights.toggle(state, 12); // light the cross...
  state.moves = 7;

  const events = Lights.toggle(state, 12); // ...and snuff it

  assert.deepEqual(events, [
    { type: "toggled", index: 12 },
    { type: "solved", moves: 8 },
  ]);
  assert.equal(state.status, "solved");
});

test("a solved board takes no more presses", () => {
  const state = makeState();
  state.status = "solved";

  assert.deepEqual(Lights.toggle(state, 0), []);
});

test("step() is an honest no-op", () => {
  const state = makeState();

  assert.deepEqual(Lights.step(state), []);
  assert.equal(state.moves, 0);
});

test("the status machine: solved is the only exit, and it is final", () => {
  const state = makeState();

  Lights.transition(state, "solved");

  assert.throws(() => Lights.transition(state, "playing"), /illegal status change/);
});
