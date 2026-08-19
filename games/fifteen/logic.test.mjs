// ============================================================================
// Tests for the Fifteen core — written before the implementation.
//
// The catalog's first TURN-BASED game: no clock, no ticks. The world only
// changes when the player acts — slide(state, index) is the whole verb —
// and step() exists as an honest no-op, because time does nothing to this
// world. Sam Loyd's famous 14-15 swindle lives here too: half of all
// arrangements are unsolvable, so shuffling is a random walk of LEGAL
// moves from the solved board — solvable by construction, verified below
// against the classical inversion-parity rule.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Fifteen from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

function makeState() {
  return Fifteen.createState({ random: fakeRandom(0.5) });
}

const solvedTiles = (size) =>
  Array.from({ length: size * size }, (_, i) => (i + 1) % (size * size));

// The classical solvability rule, implemented independently here to check
// the shuffler: count inversions among the numbered tiles; odd boards are
// solvable iff inversions are even; even boards iff inversions plus the
// blank's row-from-bottom (1-indexed) is odd.
function isSolvable(tiles, size) {
  const list = tiles.filter((t) => t !== 0);
  let inversions = 0;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (list[i] > list[j]) inversions++;
    }
  }
  if (size % 2 === 1) return inversions % 2 === 0;
  const blankRowFromBottom = size - Math.floor(tiles.indexOf(0) / size);
  return (inversions + blankRowFromBottom) % 2 === 1;
}

// --- setup ------------------------------------------------------------------

test("a new game: a shuffled 4×4 board, one gap, zero moves", () => {
  const state = makeState();

  assert.equal(state.size, 4);
  assert.equal(state.tiles.length, 16);
  assert.deepEqual([...state.tiles].sort((a, b) => a - b), Array.from({ length: 16 }, (_, i) => i));
  assert.notDeepEqual(state.tiles, solvedTiles(4), "never born solved");
  assert.equal(state.moves, 0);
  assert.equal(state.status, "playing");
});

test("createState accepts a board size", () => {
  const state = Fifteen.createState({ random: fakeRandom(0.5), size: 3 });

  assert.equal(state.tiles.length, 9);
});

test("every shuffle is solvable — no Sam Loyd swindles here", () => {
  // The shuffler random-walks legal moves from the solved board, so
  // solvability holds by construction; this checks it against the
  // independent parity rule, across sizes and random streams.
  const streams = [[0.1, 0.7, 0.3], [0.9, 0.2, 0.6], [0.5]];
  for (const size of [3, 4, 5]) {
    for (const values of streams) {
      const state = Fifteen.createState({ random: fakeRandom(...values), size });
      assert.ok(isSolvable(state.tiles, size), `size ${size}, stream ${values}`);
    }
  }
});

// --- sliding -----------------------------------------------------------------

test("a tile beside the gap slides into it", () => {
  const state = makeState();
  state.tiles = solvedTiles(4); // gap at 15; tile 12 sits above it (index 11)

  const events = Fifteen.slide(state, 11);

  assert.deepEqual(events, [{ type: "slid", tile: 12 }]);
  assert.equal(state.tiles[15], 12, "the tile moved down into the gap");
  assert.equal(state.tiles[11], 0, "the gap moved up");
  assert.equal(state.moves, 1);
});

test("a tile far from the gap stays put", () => {
  const state = makeState();
  state.tiles = solvedTiles(4);

  const events = Fifteen.slide(state, 0);

  assert.deepEqual(events, []);
  assert.equal(state.moves, 0, "illegal attempts are free");
});

test("the gap cannot slide into itself", () => {
  const state = makeState();
  state.tiles = solvedTiles(4);

  assert.deepEqual(Fifteen.slide(state, 15), []);
});

test("arrow semantics: the direction is the TILE's movement", () => {
  const state = makeState();
  state.tiles = solvedTiles(4); // gap at bottom-right (index 15)

  // "left" slides the tile right of the gap leftward — but the gap is on
  // the right edge, so nothing is there.
  assert.deepEqual(Fifteen.slideDirection(state, "left"), []);

  // "right" slides the tile left of the gap (15) rightward.
  const events = Fifteen.slideDirection(state, "right");
  assert.deepEqual(events, [{ type: "slid", tile: 15 }]);
});

// --- winning -------------------------------------------------------------------

test("the final slide reports the solve, with the move count", () => {
  const state = makeState();
  // One move from glory: 15 sits beside the gap.
  state.tiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15];
  state.moves = 41;

  const events = Fifteen.slide(state, 15);

  assert.deepEqual(events, [
    { type: "slid", tile: 15 },
    { type: "solved", moves: 42 },
  ]);
  assert.equal(state.status, "solved");
});

test("a solved board is done — no more sliding", () => {
  const state = makeState();
  state.tiles = solvedTiles(4);
  state.status = "solved";

  assert.deepEqual(Fifteen.slide(state, 11), []);
});

// --- the turn-based contract ------------------------------------------------------

test("step() is an honest no-op: time does nothing to this world", () => {
  const state = makeState();
  const before = structuredClone({ ...state, random: null });

  const events = Fifteen.step(state);

  assert.deepEqual(events, []);
  assert.deepEqual(structuredClone({ ...state, random: null }), before);
});

// --- the status machine --------------------------------------------------------

test("the status machine: solved is the only exit, and it is final", () => {
  const state = makeState();

  Fifteen.transition(state, "solved");

  assert.throws(
    () => Fifteen.transition(state, "playing"),
    /illegal status change/
  );
});
