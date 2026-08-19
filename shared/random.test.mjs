// Tests for the seeded stream — the foundation the replay plan stands on.
// The pinned vector below is a CONTRACT: if these exact numbers ever
// change, every recorded replay in the world silently breaks, so the
// test fails before the algorithm drifts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { seededRandom, shuffle } from "./random.mjs";

test("the same seed replays the same stream, value for value", () => {
  const a = seededRandom(12345);
  const b = seededRandom(12345);
  for (let i = 0; i < 1000; i++) assert.equal(a(), b());
});

test("every value lands in [0, 1)", () => {
  const random = seededRandom(0xdeadbeef);
  for (let i = 0; i < 1000; i++) {
    const v = random();
    assert.ok(v >= 0 && v < 1, `${v} escaped the unit interval`);
  }
});

test("different seeds diverge immediately", () => {
  assert.notEqual(seededRandom(1)(), seededRandom(2)());
});

test("the pinned vector: these exact values, forever", () => {
  // Recorded from mulberry32(42) — the algorithm's fingerprint. A replay
  // verifier on any engine must reproduce a browser's stream bit for bit;
  // integer mixing (Math.imul, shifts) is what ECMAScript pins exactly.
  const random = seededRandom(42);
  assert.deepEqual(Array.from({ length: 4 }, random), [
    0.6011037519201636,
    0.44829055899754167,
    0.8524657934904099,
    0.6697340414393693,
  ]);
});

test("seeds drive the existing mechanisms deterministically", () => {
  const deal = () => shuffle([1, 2, 3, 4, 5, 6, 7, 8], seededRandom(7));
  assert.deepEqual(deal(), deal());
});
