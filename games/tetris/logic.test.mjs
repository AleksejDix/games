// ============================================================================
// Tests for the Tetris core — written before the implementation.
//
// The finale, and the richest rules in the catalog: seven tetrominoes
// with rotation states and wall kicks, a 10×20 well, gravity that ticks
// like Snake's clock (stepMs shrinks per level), the seven-bag randomizer
// (every 7 pieces contain each tetromino exactly once — modern standard),
// NES-style scoring (40/100/300/1200 × level), and the only losing move:
// a spawn with nowhere to stand.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Tetris from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

function makeState() {
  return Tetris.createState({ random: fakeRandom(0.5) });
}

// Occupied absolute cells of the current piece, as "x,y" strings.
const cellKeys = (state) =>
  Tetris.pieceCells(state.piece).map(([x, y]) => `${x},${y}`);

// --- setup ------------------------------------------------------------------

test("a new game: an empty 10×20 well, a piece falling, a piece waiting", () => {
  const state = makeState();

  assert.equal(state.well.length, 200);
  assert.ok(state.well.every((c) => c === 0));
  assert.ok(Tetris.TYPES.includes(state.piece.type));
  assert.ok(Tetris.TYPES.includes(state.next));
  assert.equal(state.score, 0);
  assert.equal(state.lines, 0);
  assert.equal(state.level, 1);
  assert.equal(state.status, "playing");
});

test("the seven-bag: every 7 draws contain each tetromino exactly once", () => {
  const state = makeState();
  const firstBag = [state.piece.type, state.next];
  for (let i = 0; i < 5; i++) firstBag.push(Tetris.drawPiece(state));

  assert.deepEqual([...firstBag].sort(), [...Tetris.TYPES].sort());

  const secondBag = Array.from({ length: 7 }, () => Tetris.drawPiece(state));
  assert.deepEqual([...secondBag].sort(), [...Tetris.TYPES].sort());
});

// --- gravity ------------------------------------------------------------------

test("a gravity tick drops the piece one row", () => {
  const state = makeState();
  const y = state.piece.y;

  const events = Tetris.step(state);

  assert.deepEqual(events, []);
  assert.equal(state.piece.y, y + 1);
});

test("gravity accelerates with the level", () => {
  assert.ok(
    Tetris.gravityMs(2) < Tetris.gravityMs(1),
    "level 2 falls faster than level 1"
  );
  assert.ok(Tetris.gravityMs(99) >= 60, "but never absurdly fast");
});

// --- steering ------------------------------------------------------------------

test("move shifts the piece sideways, walls permitting", () => {
  const state = makeState();
  state.piece = { type: "O", rot: 0, x: 3, y: 5 };

  Tetris.move(state, -1);
  assert.equal(state.piece.x, 2);

  state.piece.x = -1; // O occupies columns x+1..x+2 → already on the wall
  Tetris.move(state, -1);
  assert.equal(state.piece.x, -1, "the wall does not negotiate");
});

test("rotation turns the piece and reports it", () => {
  const state = makeState();
  state.piece = { type: "T", rot: 0, x: 3, y: 5 };

  const events = Tetris.rotate(state);

  assert.deepEqual(events, [{ type: "rotated" }]);
  assert.equal(state.piece.rot, 1);
});

test("a wall kick nudges a blocked rotation sideways", () => {
  const state = makeState();
  // Vertical I hugging the right wall: rotating to horizontal needs room
  // it doesn't have — the kick shifts it left instead of refusing.
  state.piece = { type: "I", rot: 1, x: 7, y: 5 }; // occupies column 9

  const events = Tetris.rotate(state);

  assert.deepEqual(events, [{ type: "rotated" }]);
  assert.equal(state.piece.rot, 0);
  assert.ok(state.piece.x < 7, "kicked away from the wall");
});

test("an impossible rotation changes nothing", () => {
  const state = makeState();
  // A T pinned in a one-row slot: filled cells above and below its row.
  state.piece = { type: "T", rot: 2, x: 3, y: 17 }; // flat side up, stem down
  for (let x = 0; x < 10; x++) {
    state.well[17 * 10 + x] = 1; // row above the T's row
  }

  const events = Tetris.rotate(state);

  assert.deepEqual(events, []);
  assert.equal(state.piece.rot, 2);
});

// --- locking and clearing ----------------------------------------------------------

test("a piece with no room below locks into the well and the next spawns", () => {
  const state = makeState();
  const upcoming = state.next;
  state.piece = { type: "O", rot: 0, x: 3, y: 18 }; // resting on the floor

  const events = Tetris.step(state);

  assert.deepEqual(events, [{ type: "locked" }]);
  assert.ok(state.well[19 * 10 + 4] > 0, "the well remembers the piece");
  assert.equal(state.piece.type, upcoming, "the preview came true");
});

test("a full row clears, scores, and the stack above falls", () => {
  const state = makeState();
  // Row 19 is complete except columns 4 and 5 — an O-shaped appetite.
  for (let x = 0; x < 10; x++) {
    if (x !== 4 && x !== 5) state.well[19 * 10 + x] = 1;
  }
  state.piece = { type: "O", rot: 0, x: 3, y: 0 };

  const events = Tetris.hardDrop(state);

  assert.equal(events[0].type, "hardDrop");
  assert.equal(events[1].type, "locked");
  assert.deepEqual(events[2], { type: "cleared", rows: 1, points: 40 });
  assert.equal(state.lines, 1);
  // The O's top half fell into the cleared row: only those 2 cells remain.
  assert.equal(state.well.filter(Boolean).length, 2);
  assert.ok(state.well[19 * 10 + 4] > 0 && state.well[19 * 10 + 5] > 0);
});

test("four at once is a TETRIS: 1200 × level", () => {
  const state = makeState();
  // Rows 16–19 complete except column 5 — a vertical I's destiny.
  for (let r = 16; r < 20; r++) {
    for (let x = 0; x < 10; x++) {
      if (x !== 5) state.well[r * 10 + x] = 1;
    }
  }
  state.piece = { type: "I", rot: 1, x: 3, y: 0 }; // vertical, column 5

  const events = Tetris.hardDrop(state);

  const cleared = events.find((e) => e.type === "cleared");
  assert.deepEqual(cleared, { type: "cleared", rows: 4, points: 1200 });
  assert.ok(state.well.every((c) => c === 0), "the well is clean again");
});

test("ten lines raise the level and hurry gravity", () => {
  const state = makeState();
  state.lines = 9;
  for (let x = 0; x < 10; x++) {
    if (x !== 4 && x !== 5) state.well[19 * 10 + x] = 1;
  }
  state.piece = { type: "O", rot: 0, x: 3, y: 18 };

  const events = Tetris.step(state); // locks and clears

  assert.ok(events.some((e) => e.type === "levelUp" && e.level === 2));
  assert.equal(state.level, 2);
  assert.equal(state.stepMs, Tetris.gravityMs(2));
});

test("drops pay: soft one point a row, hard two", () => {
  const soft = makeState();
  soft.piece = { type: "O", rot: 0, x: 3, y: 5 };
  Tetris.softDrop(soft);
  assert.equal(soft.score, 1);

  const hard = makeState();
  hard.piece = { type: "O", rot: 0, x: 3, y: 5 };
  const events = Tetris.hardDrop(hard);
  assert.equal(events[0].type, "hardDrop");
  assert.equal(events[0].distance, 13); // y 5 → 18, the floor
  assert.equal(hard.score, 26);
});

test("a spawn with nowhere to stand is the end", () => {
  const state = makeState();
  state.next = "O";
  // The O's spawn cells (columns 4–5, rows 0–1) are already rubble.
  for (const i of [4, 5, 14, 15]) state.well[i] = 1;
  state.piece = { type: "O", rot: 0, x: 0, y: 18 }; // about to lock far away

  const events = Tetris.step(state);

  assert.deepEqual(events, [{ type: "locked" }, { type: "died" }]);
  assert.equal(state.status, "gameover");
});

test("after gameover, nothing moves", () => {
  const state = makeState();
  state.status = "gameover";

  assert.deepEqual(Tetris.step(state), []);
  assert.deepEqual(Tetris.move(state, 1), []);
  assert.deepEqual(Tetris.rotate(state), []);
  assert.deepEqual(Tetris.hardDrop(state), []);
});

test("the status machine: topping out is the only exit", () => {
  const state = makeState();

  Tetris.transition(state, "gameover");

  assert.throws(
    () => Tetris.transition(state, "playing"),
    /illegal status change/
  );
});
