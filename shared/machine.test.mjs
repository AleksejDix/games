// ============================================================================
// Tests for the shared state-machine factory — the MECHANISM is tested once
// here; each game's suite tests its own GRAPH (the data).
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createMachine } from "./machine.mjs";

// A toy graph, unrelated to any game — the mechanism doesn't care.
const { transition, can } = createMachine({
  idle: ["running"],
  running: ["idle", "done"],
  done: [],
});

test("transition() follows the table and updates the status", () => {
  const state = { status: "idle" };

  transition(state, "running");

  assert.equal(state.status, "running");
});

test("an illegal jump throws and leaves the status untouched", () => {
  const state = { status: "done" }; // terminal — no exits

  assert.throws(
    () => transition(state, "running"),
    /illegal status change: done → running/
  );
  assert.equal(state.status, "done");
});

test("can() answers without mutating anything", () => {
  const state = { status: "idle" };

  assert.equal(can(state, "running"), true);
  assert.equal(can(state, "done"), false);
  assert.equal(state.status, "idle");
});

test("an unknown status can go nowhere", () => {
  const state = { status: "limbo" };

  assert.equal(can(state, "idle"), false);
});
