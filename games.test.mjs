// ============================================================================
// Tests for the catalog's data layer — the manifest and its filter.
//
// Even the shell app follows the house rule: the LOGIC (filtering) is
// pure and tested here; catalog.mjs is only the DOM that calls it. These
// tests also pin manifest completeness — a game missing its genre would
// silently vanish from a filter, so that's an invariant now.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { GAMES, filterGames } from "./games.mjs";

test("every game declares its card data: title, year, genre, blurb", () => {
  for (const game of GAMES) {
    assert.equal(typeof game.id, "string", `${game.id}: id`);
    assert.equal(typeof game.title, "string", `${game.id}: title`);
    assert.equal(typeof game.year, "number", `${game.id}: year`);
    assert.equal(typeof game.genre, "string", `${game.id}: genre`);
    assert.ok(game.blurb.length > 0, `${game.id}: blurb`);
  }
});

test("no filters — the whole catalog", () => {
  assert.equal(filterGames(GAMES, {}).length, GAMES.length);
  assert.equal(filterGames(GAMES).length, GAMES.length);
});

test("name search is a case-insensitive substring match", () => {
  const hits = filterGames(GAMES, { query: "SnAk" });

  assert.deepEqual(hits.map((g) => g.id), ["snake"]);
});

test("the search also reads the blurbs", () => {
  const hits = filterGames(GAMES, { query: "bricks" });

  assert.ok(hits.some((g) => g.id === "breakout"));
});

test("genre narrows to its family", () => {
  const hits = filterGames(GAMES, { genre: "paddle" });

  assert.deepEqual(hits.map((g) => g.id), ["pong", "breakout"]);
});

test("year narrows to its class", () => {
  const hits = filterGames(GAMES, { year: 1976 });

  assert.ok(hits.length >= 2, "1976 was a good year");
  assert.ok(hits.every((g) => g.year === 1976));
});

test("filters combine — each narrows the last", () => {
  const hits = filterGames(GAMES, { genre: "shooter", year: 1978 });

  assert.deepEqual(hits.map((g) => g.id), ["invaders"]);
});

test("'all' is the neutral value for the dropdowns", () => {
  const hits = filterGames(GAMES, { genre: "all", year: "all", query: "" });

  assert.equal(hits.length, GAMES.length);
});
