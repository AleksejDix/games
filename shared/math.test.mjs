import { test } from "node:test";
import assert from "node:assert/strict";
import { clamp } from "./math.mjs";

test("clamp pins a value into its range", () => {
  assert.equal(clamp(5, 0, 10), 5); // inside → untouched
  assert.equal(clamp(-3, 0, 10), 0); // below → floor
  assert.equal(clamp(42, 0, 10), 10); // above → ceiling
});
