// ============================================================================
// Tests for the Sokoban core — written before the implementation.
//
// The catalog's second warehouse-era puzzle after Fifteen, and turn-based
// like it: no clock, no ticks, step() an honest no-op. The whole game is
// one verb — move(state, dir) walks a cell and pushes at most ONE box —
// and one mercy: undo(state), free and unlimited, restoring each step
// EXACTLY (keeper, box, both counters). The levels are data, so the
// suite also audits every shipped warehouse: rectangular, one keeper,
// as many boxes as goals, never born solved.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Sokoban from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

// A state booted from hand-drawn rows — what createState does for the
// shipped levels, minus the shelf.
const boot = (rows) => ({
  ...Sokoban.parseLevel(rows),
  level: 0,
  random: null,
  facing: "down",
  moves: 0,
  pushes: 0,
  history: [],
  status: "playing",
});

// State minus the injected random function — the one non-data field.
const snapshot = (state) => structuredClone({ ...state, random: null });

// A quiet room for walking (its box stays out of the way — a boxless
// room would be vacuously solved); a lane with a far goal for pushing.
const ROOM = [
  "#####",
  "#  .#",
  "# @ #",
  "#$  #",
  "#####",
];
const LANE = [
  "#######",
  "#     #",
  "# @$ .#",
  "#     #",
  "#######",
];

// --- parsing ----------------------------------------------------------------

test("parsing: walls, floor, goal, box, keeper — all found where drawn", () => {
  const parsed = Sokoban.parseLevel([
    "#####",
    "#@$.#",
    "#####",
  ]);

  assert.equal(parsed.cols, 5);
  assert.equal(parsed.rows, 3);
  assert.ok(parsed.walls[0] && parsed.walls[4] && parsed.walls[10], "the border is wall");
  assert.equal(parsed.keeper, 6);
  assert.deepEqual(parsed.boxes, [7]);
  assert.ok(parsed.goals[8], "the goal sits right of the box");
  assert.ok(!parsed.goals[7] && !parsed.walls[6], "floor is neither");
});

test("parsing: * is a box on a goal, + is the keeper on one", () => {
  const parsed = Sokoban.parseLevel([
    "####",
    "#+*#",
    "####",
  ]);

  assert.equal(parsed.keeper, 5);
  assert.ok(parsed.goals[5], "the keeper stands on a goal");
  assert.deepEqual(parsed.boxes, [6]);
  assert.ok(parsed.goals[6], "the box already sits on one");
});

test("parsing: ragged rows pad out with floor into a rectangle", () => {
  const parsed = Sokoban.parseLevel([
    "#####",
    "#@$.#",
    "###",
  ]);

  assert.equal(parsed.walls.length, 15, "every cell exists");
  assert.ok(!parsed.walls[13], "the padding is floor, not wall");
});

// --- walking ----------------------------------------------------------------

test("a step moves the keeper, counts a move, turns his notch", () => {
  const state = boot(ROOM);

  const events = Sokoban.move(state, "up");

  assert.deepEqual(events, [{ type: "moved", dir: "up" }]);
  assert.equal(state.keeper, 7, "one cell up");
  assert.equal(state.moves, 1);
  assert.equal(state.pushes, 0, "no box was touched");
  assert.equal(state.facing, "up");
});

test("walls refuse — and the refusal is completely free", () => {
  const state = boot(ROOM);
  Sokoban.move(state, "up"); // now against the top wall
  const before = snapshot(state);

  assert.deepEqual(Sokoban.move(state, "up"), []);
  assert.deepEqual(snapshot(state), before, "nothing counted, nothing recorded");
});

// --- pushing ----------------------------------------------------------------

test("a push moves box and keeper together, counting a move AND a push", () => {
  const state = boot(LANE);

  const events = Sokoban.move(state, "right");

  assert.deepEqual(events, [
    { type: "moved", dir: "right" },
    { type: "pushed", index: 0, from: 17, to: 18 },
  ]);
  assert.equal(state.keeper, 17, "the keeper takes the box's old cell");
  assert.deepEqual(state.boxes, [18]);
  assert.equal(state.moves, 1);
  assert.equal(state.pushes, 1);
});

test("pushing a box into a wall refuses", () => {
  const state = boot([
    "#####",
    "#@$##",
    "#####",
  ]);
  const before = snapshot(state);

  assert.deepEqual(Sokoban.move(state, "right"), []);
  assert.deepEqual(snapshot(state), before);
});

test("pushing a box into another box refuses — never two in a row", () => {
  const state = boot([
    "######",
    "#@$$ #",
    "######",
  ]);
  const before = snapshot(state);

  assert.deepEqual(Sokoban.move(state, "right"), []);
  assert.deepEqual(snapshot(state), before);
});

// --- undo -------------------------------------------------------------------

test("undo restores a push EXACTLY — keeper, box, both counters", () => {
  const state = boot(LANE);
  const before = snapshot(state);
  Sokoban.move(state, "right");

  const events = Sokoban.undo(state);

  assert.deepEqual(events, [{ type: "undone" }]);
  assert.deepEqual(snapshot(state), before);
});

test("undo rewinds a whole line of moves, step by step", () => {
  const state = boot(LANE);
  const before = snapshot(state);
  for (const dir of ["up", "right", "down", "right"]) Sokoban.move(state, dir);

  while (Sokoban.undo(state).length) {} // all the way home

  assert.deepEqual(snapshot(state), before);
});

test("undoing past the start is a quiet no-op", () => {
  const state = boot(ROOM);
  const before = snapshot(state);

  assert.deepEqual(Sokoban.undo(state), []);
  assert.deepEqual(snapshot(state), before);
});

// --- winning ----------------------------------------------------------------

test("the first warehouse falls to its known fewest line", () => {
  const state = Sokoban.createState({ random: fakeRandom(0.5), level: 0 });

  // The BFS-verified optimum for level 1: walk around, push down once.
  for (const dir of ["up", "up", "left"]) Sokoban.move(state, dir);
  const events = Sokoban.move(state, "down");

  assert.deepEqual(events, [
    { type: "moved", dir: "down" },
    { type: "pushed", index: 0, from: 14, to: 20 },
    { type: "solved", moves: 4, pushes: 1 },
  ]);
  assert.equal(state.status, "solved");
});

test("a solved warehouse is done — no more steps, none taken back", () => {
  const state = Sokoban.createState({ random: fakeRandom(0.5), level: 0 });
  for (const dir of ["up", "up", "left", "down"]) Sokoban.move(state, dir);

  assert.deepEqual(Sokoban.move(state, "up"), []);
  assert.deepEqual(Sokoban.undo(state), []);
});

// --- the shipped levels -----------------------------------------------------

test("every shipped warehouse is well-formed", () => {
  assert.equal(Sokoban.LEVELS.length, 8);
  Sokoban.LEVELS.forEach((rows, n) => {
    const parsed = Sokoban.parseLevel(rows);
    const chars = [...rows.join("")];

    assert.equal(parsed.walls.length, parsed.cols * parsed.rows, `level ${n + 1} pads square`);
    assert.equal(
      chars.filter((ch) => ch === "@" || ch === "+").length,
      1,
      `level ${n + 1} has exactly one keeper`
    );
    assert.equal(
      parsed.boxes.length,
      parsed.goals.filter(Boolean).length,
      `level ${n + 1} has as many boxes as goals`
    );
    assert.ok(parsed.boxes.length > 0, `level ${n + 1} has work to do`);
    assert.ok(!Sokoban.isSolved(parsed), `level ${n + 1} is never born solved`);
  });
});

// --- the turn-based contract ------------------------------------------------

test("step() is an honest no-op: time does nothing to this world", () => {
  const state = Sokoban.createState({ random: fakeRandom(0.5) });
  const before = snapshot(state);

  assert.deepEqual(Sokoban.step(state), []);
  assert.deepEqual(snapshot(state), before);
});

// --- the status machine -----------------------------------------------------

test("the status machine: solved is the only exit, and it is final", () => {
  const state = Sokoban.createState({ random: fakeRandom(0.5) });

  Sokoban.transition(state, "solved");

  assert.throws(
    () => Sokoban.transition(state, "playing"),
    /illegal status change/
  );
});

// --- the corner verdict -----------------------------------------------------

test("a crate pushed into a bare corner is declared dead on the spot", () => {
  const state = boot([
    "#####",
    "#  .#",
    "#$  #",
    "#@  #",
    "#####",
  ]);

  const events = Sokoban.move(state, "up"); // shoves the crate into the corner

  assert.ok(events.some((e) => e.type === "stuck"), "the verdict lands with the push");
  assert.deepEqual(Sokoban.deadBoxes(state), [state.boxes[0]], "and names the crate");

  Sokoban.undo(state);
  assert.deepEqual(Sokoban.deadBoxes(state), [], "one undo and the room breathes again");
});

test("a cornered crate ON a goal is parked, not dead", () => {
  const state = boot([
    "#####",
    "#*  #",
    "# @ #",
    "# $.#",
    "#####",
  ]);

  assert.deepEqual(Sokoban.deadBoxes(state), [], "home is home, even in a corner");
});
