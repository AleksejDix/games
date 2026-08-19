// ============================================================================
// Tests for the Minesweeper core — 1989, the office pastime. Hidden
// state like Memory, but ADVERSARIAL: the numbers are honest, the
// silence is not. Mines are planted on the FIRST reveal (never under
// it), zeros flood outward, flags are beliefs — only reveals are facts.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Mines from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const makeState = () => Mines.createState({ random: fakeRandom(0.31, 0.77, 0.13) });

// A hand-planted 4-mine board on 9×9 for deterministic digs.
function plantCorner(state) {
  state.planted = true;
  state.mines = Array(81).fill(false);
  for (const i of [0, 1, 9, 80]) state.mines[i] = true; // a corner nest + one far
  state.counts = Mines.computeCounts(state);
  state.safeLeft = 81 - 4;
  state.mineCount = 4;
}

test("a new game: a covered field, mines not yet real", () => {
  const state = makeState();

  assert.equal(state.size, 9);
  assert.equal(state.mineCount, 10);
  assert.equal(state.planted, false, "mines wait for the first dig");
  assert.ok(state.revealed.every((r) => !r));
  assert.equal(state.status, "playing");
});

test("the first dig is always safe — mines avoid it", () => {
  const state = makeState();

  const events = Mines.reveal(state, 40);

  assert.ok(state.planted);
  assert.equal(state.mines[40], false, "never under the first click");
  assert.equal(state.mines.filter(Boolean).length, 10);
  assert.equal(events[0].type, "revealed");
});

test("numbers count their neighboring mines honestly", () => {
  const state = makeState();
  plantCorner(state);

  assert.equal(state.counts[10], 3, "diagonal to the corner nest");
  assert.equal(state.counts[2], 1);
  assert.equal(state.counts[40], 0, "the quiet middle");
});

test("a zero floods: the whole quiet region opens at once", () => {
  const state = makeState();
  plantCorner(state);

  const events = Mines.reveal(state, 40);

  assert.equal(events[0].type, "revealed");
  assert.ok(events[0].cells > 50, `flood opened ${events[0].cells}`);
  assert.ok(state.revealed[40] && state.revealed[44] && state.revealed[70]);
  assert.ok(!state.revealed[0], "mines stay covered");
});

test("flags plant and lift, and shield a cell from digging", () => {
  const state = makeState();
  plantCorner(state);

  assert.deepEqual(Mines.flag(state, 5), [{ type: "flagged", left: 3 }]);
  assert.deepEqual(Mines.reveal(state, 5), [], "a flagged cell cannot be dug");
  assert.deepEqual(Mines.flag(state, 5), [{ type: "unflagged", left: 4 }]);
});

test("digging a mine is the end, and the field confesses", () => {
  const state = makeState();
  plantCorner(state);

  const events = Mines.reveal(state, 0);

  assert.deepEqual(events, [{ type: "boom", index: 0 }, { type: "died" }]);
  assert.equal(state.status, "gameover");
  assert.ok(state.revealed[80], "every mine shows itself at the end");
});

test("revealing every safe cell wins", () => {
  const state = makeState();
  plantCorner(state);
  // Open everything safe but one, by hand.
  state.mines.forEach((mine, i) => {
    if (!mine && i !== 2) state.revealed[i] = true;
  });
  state.safeLeft = 1;

  const events = Mines.reveal(state, 2);

  assert.equal(events.at(-1).type, "solved");
  assert.equal(state.status, "solved");
});

test("finished fields are inert; step is a no-op", () => {
  const state = makeState();
  state.status = "gameover";
  assert.deepEqual(Mines.reveal(state, 40), []);
  assert.deepEqual(Mines.flag(state, 40), []);
  assert.deepEqual(Mines.step(state), []);
});

test("the status machine: solved or blown, both final", () => {
  const state = makeState();
  Mines.transition(state, "gameover");
  assert.throws(() => Mines.transition(state, "playing"), /illegal status change/);
});
