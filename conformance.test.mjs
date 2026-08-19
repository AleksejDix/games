// ============================================================================
// conformance.test.mjs — the shell↔core CONTRACT, as executable tests.
//
// Every game core promises the same interface: createState(options) with
// injectable random, step() returning an events array, a status the
// machine knows, and terminal states that are truly inert. Until now that
// contract lived in convention; a new game could quietly drift. This suite
// runs the SAME tests against every live core in the manifest — it tests
// the contract, never the rules (each game's own suite does that).
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { GAMES } from "./games.mjs";
import { fakeRandom } from "./shared/testing.mjs";

// Per-game harness knowledge: the minimal createState options, and random
// values that terminate rejection sampling (Snake's food spawner cycles
// forever on a value that keeps landing on the snake).
const HARNESS = {
  snake: { options: { cols: 10, rows: 10 }, randomValues: [0.0, 0.0] },
  pong: { options: {}, randomValues: [0.5] },
  breakout: { options: {}, randomValues: [0.5] },
  asteroids: { options: {}, randomValues: [0.5] },
  invaders: { options: {}, randomValues: [0.5] },
  lander: { options: {}, randomValues: [0.5] },
  racer: { options: {}, randomValues: [0.5] },
  missiles: { options: {}, randomValues: [0.5] },
  fifteen: { options: {}, randomValues: [0.5] },
};

const cores = await Promise.all(
  GAMES.filter((g) => g.live).map(async (g) => [g.id, await import(`./games/${g.id}/logic.mjs`)])
);

// State minus the injected random function — the one non-data field.
const snapshot = (state) => structuredClone({ ...state, random: null });

for (const [id, core] of cores) {
  const makeState = () =>
    core.createState({
      ...HARNESS[id].options,
      random: fakeRandom(...HARNESS[id].randomValues),
    });

  test(`${id}: exports the contract surface`, () => {
    assert.equal(typeof core.createState, "function");
    assert.equal(typeof core.step, "function");
    assert.equal(typeof core.transition, "function");
    assert.equal(typeof core.TRANSITIONS, "object");
  });

  test(`${id}: createState starts in a status the machine knows`, () => {
    const state = makeState();
    assert.ok(
      state.status in core.TRANSITIONS,
      `status "${state.status}" is not in the transition table`
    );
  });

  test(`${id}: step() returns an array of typed events`, () => {
    const events = core.step(makeState());
    assert.ok(Array.isArray(events), "step() must return an array");
    for (const event of events) {
      assert.equal(typeof event.type, "string", "every event carries a type");
    }
  });

  test(`${id}: terminal statuses are inert — step() returns [] and changes nothing`, () => {
    const terminals = Object.entries(core.TRANSITIONS)
      .filter(([, exits]) => exits.length === 0)
      .map(([status]) => status);
    assert.ok(terminals.length > 0, "every game must be able to end");

    for (const status of terminals) {
      const state = makeState();
      state.status = status;
      const before = snapshot(state);

      assert.deepEqual(core.step(state, 1), [], `step() during "${status}"`);
      assert.deepEqual(snapshot(state), before, `state mutated during "${status}"`);
    }
  });

  test(`${id}: the transition graph is closed — no edge to an unknown status`, () => {
    for (const [from, exits] of Object.entries(core.TRANSITIONS)) {
      for (const to of exits) {
        assert.ok(to in core.TRANSITIONS, `${from} → ${to} names an unknown status`);
      }
    }
  });
}
