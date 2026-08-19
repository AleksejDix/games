// ============================================================================
// Tests for the 2048 core — 2014, the newest game in the catalog. Four
// slides, greedy merges, a tile spawned after every real move, and an
// ending only when the board is full AND silent. The merge rule's fine
// print matters: each tile merges at most once per slide.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as G from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const makeState = () => G.createState({ random: fakeRandom(0.3, 0.4) });

test("a new game: two tiles on an empty board", () => {
  const state = makeState();

  assert.equal(state.cells.length, 16);
  assert.equal(state.cells.filter(Boolean).length, 2);
  assert.ok(state.cells.every((c) => c === 0 || c === 2 || c === 4));
  assert.equal(state.score, 0);
  assert.equal(state.status, "playing");
});

test("a slide packs tiles and merges equal neighbors", () => {
  const state = makeState();
  state.cells = [
    2, 0, 2, 0,
    4, 4, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
  ];

  const events = G.slide(state, "left");

  assert.equal(state.cells[0], 4, "2+2 met");
  assert.equal(state.cells[4], 8, "4+4 met");
  assert.equal(state.score, 12, "merges pay their sum");
  assert.ok(events.some((e) => e.type === "merged" && e.points === 12));
  assert.equal(state.cells.filter(Boolean).length, 3, "and one new tile spawned");
});

test("the slid event narrates every tile's journey — the animation's data", () => {
  const state = makeState();
  state.cells = [
    2, 0, 2, 0,
    4, 4, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
  ];

  const events = G.slide(state, "left");

  const { moves } = events.find((e) => e.type === "slid");
  assert.deepEqual(
    moves.sort((a, b) => a.from - b.from),
    [
      { from: 0, to: 0, value: 2 },
      { from: 2, to: 0, value: 2 }, // both 2s travel to the same slot
      { from: 4, to: 4, value: 4 },
      { from: 5, to: 4, value: 4 },
    ]
  );
  const spawned = events.find((e) => e.type === "spawned");
  assert.ok(spawned, "the new tile is announced");
  assert.ok(state.cells[spawned.index] > 0);
});

test("the fine print: a tile merges at most once per slide", () => {
  const state = makeState();
  state.cells = [
    2, 2, 2, 2,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
  ];

  G.slide(state, "left");

  assert.equal(state.cells[0], 4);
  assert.equal(state.cells[1], 4, "4-4, never 8");
});

test("a slide that moves nothing is not a move — no spawn, no events", () => {
  const state = makeState();
  state.cells = [
    2, 4, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
  ];

  assert.deepEqual(G.slide(state, "left"), []);
  assert.equal(state.cells.filter(Boolean).length, 2);
});

test("all four directions obey the same physics", () => {
  const state = makeState();
  state.cells = [
    2, 0, 0, 0,
    2, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
  ];

  G.slide(state, "up");

  assert.equal(state.cells[0], 4, "the column packed upward and merged");
});

test("a new summit is a milestone", () => {
  const state = makeState();
  state.cells[0] = 64;
  state.cells[1] = 64;
  state.top = 64;

  const events = G.slide(state, "left");

  assert.ok(events.some((e) => e.type === "milestone" && e.value === 128));
});

test("full and silent is the end", () => {
  const state = makeState();
  // One hole, one legal slide. The bottom row packs right, the spawn
  // fills the hole as a 4 (fakeRandom(0): pick the only empty, roll a
  // "four"), and the result is a perfect no-neighbors board — full and
  // mute, so the slide itself must announce the death.
  state.cells = [
    2, 4, 2, 4,
    4, 8, 4, 2,
    2, 4, 2, 4,
    8, 4, 2, 0,
  ];
  state.random = fakeRandom(0);

  const events = G.slide(state, "right");

  assert.ok(state.cells.every(Boolean), "the board is full");
  assert.ok(!G.anyMoves(state), "and no merge remains");
  assert.ok(events.some((e) => e.type === "died"), "the slide says so");
  assert.equal(state.status, "gameover");
});

test("dead boards ignore slides; step is a no-op", () => {
  const state = makeState();
  state.status = "gameover";
  assert.deepEqual(G.slide(state, "left"), []);
  assert.deepEqual(G.step(state), []);
});

test("the status machine: the full board is the only exit", () => {
  const state = makeState();
  G.transition(state, "gameover");
  assert.throws(() => G.transition(state, "playing"), /illegal status change/);
});
