// ============================================================================
// determinism.test.mjs — the REPLAY contract, as executable tests.
//
// The leaderboard plan stands on one sentence: same seed + same inputs
// ⇒ the same game, bit for bit. architecture.test.mjs bans the obvious
// leaks (wall clocks, Math.random mid-core); this suite checks the
// promise itself, by running every live core twice from the same seed
// and demanding identical canonical states.
//
// The worlds it runs are the manifest's own thumbnail configs — the
// same options and tick counts the catalog animates its cards with —
// so action games run hundreds of real simulated ticks, randomness,
// spawns, and all.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { GAMES } from "./games.mjs";
import { seededRandom } from "./shared/random.mjs";
import { canonical } from "./shared/testing.mjs";
import { replayTurns, sameGame } from "./shared/replay.mjs";

const SEED = 20260819;

const cores = await Promise.all(
  GAMES.filter((g) => g.live).map(async (g) => [g, await import(`./games/${g.id}/logic.mjs`)])
);

for (const [game, core] of cores) {
  const ticks = Math.min(game.thumb?.ticks ?? 0, 300) || 60;

  test(`${game.id}: same seed, same world — twice`, () => {
    const run = () => {
      const state = core.createState({
        ...game.thumb?.options,
        random: seededRandom(SEED),
      });
      for (let i = 0; i < ticks; i++) core.step(state);
      return canonical(state);
    };
    assert.deepEqual(run(), run());
  });

  test(`${game.id}: the state is pure data — canonical form loses nothing but the dice`, () => {
    const state = core.createState({
      ...game.thumb?.options,
      random: seededRandom(SEED),
    });
    for (let i = 0; i < ticks; i++) core.step(state);
    // structuredClone is the reference for "what the state holds";
    // canonical (JSON + Set flattening) must carry the same facts. A
    // field only one of them survives is a field a replay would lose.
    const reference = canonical(structuredClone({ ...state, random: null }));
    assert.deepEqual(canonical(state), reference);
  });
}

// --- the recorder's other half: replayTurns walks the declared doors ---

const coreOf = (id) => cores.find(([g]) => g.id === id)[1];

test("replayTurns: an OXO game against the machine replays move for move", () => {
  const Oxo = coreOf("oxo");
  const doors = {
    pick: { action: (s, i) => Oxo.place(s, i) },
    opponent: { play: (s) => Oxo.place(s, Oxo.botMove(s)) },
  };
  const recording = {
    seed: 7,
    options: {},
    moves: [
      { via: "pick", index: 4 }, { via: "cpu" },
      { via: "pick", index: 1 }, { via: "cpu" },
      { via: "pick", index: 3 }, { via: "cpu" },
    ],
  };

  const once = replayTurns(Oxo, recording, doors);
  const twice = replayTurns(Oxo, recording, doors);

  assert.ok(sameGame(once, twice), "the same recording is the same game");
  assert.equal(once.cells.filter(Boolean).length, 6, "all six moves landed");
});

test("replayTurns: Fifteen replays through the keyboard door, shuffle and all", () => {
  const Fifteen = coreOf("fifteen");
  const doors = {
    actions: Object.fromEntries(
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].map((code) => [
        code,
        (s) => Fifteen.slideDirection(s, code.slice(5).toLowerCase()),
      ])
    ),
  };
  const recording = {
    seed: 99,
    options: { size: 4 },
    // All four directions: whatever seed 99 shuffled, the blank has at
    // least two neighbors, so at least two of these slides are legal.
    moves: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].map((code) => ({
      via: "key",
      code,
    })),
  };

  const once = replayTurns(Fifteen, recording, doors);
  assert.ok(sameGame(once, replayTurns(Fifteen, recording, doors)));
  assert.ok(once.moves > 0, "the recorded keys really slid tiles");
});
