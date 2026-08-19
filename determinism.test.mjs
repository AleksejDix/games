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
