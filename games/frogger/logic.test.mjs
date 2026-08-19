// ============================================================================
// Tests for the Frogger core — 1981. Two worlds in one crossing: the
// road, where touching traffic kills, and the river, where NOT touching
// traffic kills. The frog hops on a grid (Snake's taps) while the lanes
// flow continuously (Pong's clock) — and on a log, the frog's position
// becomes RELATIVE to its carrier: the catalog's first moving platform.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Frog from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

const makeState = () => Frog.createState({ random: fakeRandom(0.5) });

test("a new game: the frog at the bottom, lanes flowing, homes empty", () => {
  const state = makeState();

  assert.equal(state.frog.row, Frog.ROWS - 1);
  assert.equal(state.lives, Frog.LIVES);
  assert.ok(state.lanes.some((l) => l && l.items.length > 0));
  assert.ok(state.homes.every((h) => !h));
  assert.equal(state.status, "playing");
});

test("hops move one cell and stay on the board", () => {
  const state = makeState();
  const row = state.frog.row;

  assert.deepEqual(Frog.hop(state, "up"), [{ type: "hopped" }]);
  assert.equal(state.frog.row, row - 1);

  state.frog.x = 20;
  Frog.hop(state, "left");
  assert.equal(state.frog.x, 20, "the left edge holds");
});

test("road traffic is lethal", () => {
  const state = makeState();
  const row = Frog.ROAD_ROWS[0];
  state.frog.row = row;
  state.frog.x = 240;
  state.lanes[row].items = [{ x: 240 }];

  const events = Frog.step(state);

  assert.ok(events.some((e) => e.type === "croaked"));
  assert.equal(state.lives, Frog.LIVES - 1);
  assert.equal(state.frog.row, Frog.ROWS - 1, "back to the start");
});

test("the river is lethal — unless you stand on something", () => {
  const state = makeState();
  const row = Frog.RIVER_ROWS[0];
  state.frog.row = row;
  state.frog.x = 240;
  state.lanes[row].items = []; // empty water

  const events = Frog.step(state);

  assert.ok(events.some((e) => e.type === "croaked"), "swimming is not hopping");
});

test("a log carries its passenger — position becomes relative", () => {
  const state = makeState();
  const row = Frog.RIVER_ROWS[0];
  const lane = state.lanes[row];
  state.frog.row = row;
  state.frog.x = 240;
  lane.items = [{ x: 240 }];
  const drift = lane.dir * lane.speed * Frog.DT;

  Frog.step(state);

  assert.ok(Math.abs(state.frog.x - (240 + drift)) < 1e-9, "carried with the log");
});

test("riding off the edge is a quiet way to drown", () => {
  const state = makeState();
  const row = Frog.RIVER_ROWS[0];
  const lane = state.lanes[row];
  lane.dir = 1;
  state.frog.row = row;
  state.frog.x = Frog.COURT.width - 1;
  lane.items = [{ x: Frog.COURT.width - 1 }];

  // Enough ticks to be carried past the wall.
  let events = [];
  for (let i = 0; i < 200 && !events.some((e) => e.type === "croaked"); i++) {
    events = Frog.step(state);
  }
  assert.ok(events.some((e) => e.type === "croaked"));
});

test("an empty home bay welcomes the frog and scores", () => {
  const state = makeState();
  state.frog.row = 1;
  state.frog.x = Frog.HOME_XS[2];

  const events = Frog.hop(state, "up");

  assert.ok(events.some((e) => e.type === "home" && e.left === 4));
  assert.ok(state.homes[2]);
  assert.equal(state.frog.row, Frog.ROWS - 1, "and the next frog steps up");
  assert.ok(state.score > 0);
});

test("hopping into the hedge is a mistake", () => {
  const state = makeState();
  state.frog.row = 1;
  state.frog.x = Frog.HOME_XS[2] + 60; // between bays

  const events = Frog.hop(state, "up");

  assert.ok(events.some((e) => e.type === "croaked"));
});

test("filling every home clears the level and quickens the water", () => {
  const state = makeState();
  state.homes = [true, true, true, true, false];
  const pace = state.pace;
  state.frog.row = 1;
  state.frog.x = Frog.HOME_XS[4];

  const events = Frog.hop(state, "up");

  assert.ok(events.some((e) => e.type === "cleared" && e.level === 2));
  assert.ok(state.homes.every((h) => !h), "fresh bays");
  assert.ok(state.pace > pace, "everything flows faster now");
});

test("the last life is the end", () => {
  const state = makeState();
  state.lives = 1;
  state.frog.row = Frog.ROAD_ROWS[0];
  state.frog.x = 240;
  state.lanes[Frog.ROAD_ROWS[0]].items = [{ x: 240 }];

  const events = Frog.step(state);

  assert.ok(events.some((e) => e.type === "died"));
  assert.equal(state.status, "gameover");
});

test("the status machine: run out of frogs, and it's over", () => {
  const state = makeState();
  Frog.transition(state, "gameover");
  assert.throws(() => Frog.transition(state, "playing"), /illegal status change/);
});
