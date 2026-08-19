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
import { GAMES, filterGames, sortGames } from "./games.mjs";

test("every game declares its card data: title, year, genre, blurb", () => {
  for (const game of GAMES) {
    assert.equal(typeof game.id, "string", `${game.id}: id`);
    assert.equal(typeof game.title, "string", `${game.id}: title`);
    assert.equal(typeof game.year, "number", `${game.id}: year`);
    assert.equal(typeof game.genre, "string", `${game.id}: genre`);
    assert.ok(game.blurb.length > 0, `${game.id}: blurb`);
  }
});

test("every game declares its inputs, from the fixed vocabulary", () => {
  // The input filter is only as honest as this data: keyboard, mouse,
  // touch — at least one each, nothing outside the vocabulary.
  for (const game of GAMES) {
    assert.ok(Array.isArray(game.inputs) && game.inputs.length > 0, `${game.id}: inputs`);
    for (const input of game.inputs) {
      assert.ok(["keyboard", "mouse", "touch"].includes(input), `${game.id}: ${input}`);
    }
  }
});

test("the input filter finds what a device can play", () => {
  const touch = filterGames(GAMES, { input: "touch" });
  assert.ok(touch.some((g) => g.id === "snake"), "thumb-bar games count as touch");
  assert.ok(touch.some((g) => g.id === "mines"), "long-press flags earned the icon");
  assert.ok(!touch.some((g) => !g.inputs.includes("touch")), "the filter stays honest");

  const mouse = filterGames(GAMES, { input: "mouse" });
  assert.ok(mouse.some((g) => g.id === "mines"));
  assert.ok(!mouse.some((g) => g.id === "tetris"), "Tetris has no pointer play");

  assert.equal(filterGames(GAMES, { input: "all" }).length, GAMES.length);
});

test("input combines with the other filters", () => {
  const hits = filterGames(GAMES, { input: "touch", genre: "puzzle", query: "slide" });
  assert.ok(hits.every((g) => g.inputs.includes("touch") && g.genre === "puzzle"));
});

test("every game declares its modes — always solo, versus where a second human can sit", () => {
  for (const game of GAMES) {
    assert.ok(Array.isArray(game.modes) && game.modes.includes("solo"), `${game.id}: modes`);
    for (const mode of game.modes) {
      assert.ok(["solo", "versus"].includes(mode), `${game.id}: ${mode}`);
    }
  }
});

test("the players filter separates versus games from solo-only ones", () => {
  const versus = filterGames(GAMES, { mode: "versus" });
  assert.deepEqual(
    versus.map((g) => g.id).sort(),
    ["checkers", "chess", "memory", "oxo", "pong"],
    "the games with a real second seat"
  );

  assert.equal(filterGames(GAMES, { mode: "solo" }).length, GAMES.length,
    "every game can be played alone");
  assert.equal(filterGames(GAMES, { mode: "all" }).length, GAMES.length);
});

test("every live game declares its thumbnail recipe", () => {
  // The catalog renders REAL frames as thumbnails: court size to draw at,
  // ticks to simulate first, options createState needs.
  for (const game of GAMES.filter((g) => g.live)) {
    assert.equal(typeof game.thumb?.width, "number", `${game.id}: thumb.width`);
    assert.equal(typeof game.thumb?.height, "number", `${game.id}: thumb.height`);
    assert.equal(typeof game.thumb?.ticks, "number", `${game.id}: thumb.ticks`);
  }
});

test("record declarations are well-formed — the reader depends on the shape", () => {
  for (const game of GAMES.filter((g) => g.record)) {
    const { unit, fewest, variants } = game.record;
    assert.ok(
      Boolean(unit) !== Boolean(fewest),
      `${game.id}: a record is either { unit } (highest wins) or { fewest } (lowest wins)`
    );
    if (variants) {
      assert.equal(typeof variants, "string", `${game.id}: variants labels the key suffix`);
      assert.ok(fewest, `${game.id}: only fewest records are kept per variant today`);
    }
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

test("sortGames orders a copy: name, oldest, newest — shelf order by default", () => {
  const byName = sortGames(GAMES, "name");
  assert.deepEqual(
    byName.map((g) => g.title),
    [...GAMES.map((g) => g.title)].sort()
  );

  const oldest = sortGames(GAMES, "oldest");
  assert.equal(oldest[0].year, Math.min(...GAMES.map((g) => g.year)));

  const newest = sortGames(GAMES, "newest");
  assert.equal(newest[0].year, Math.max(...GAMES.map((g) => g.year)));

  assert.deepEqual(sortGames(GAMES, "shelf"), GAMES, "default keeps the shelf");
  assert.notEqual(byName, GAMES, "always a copy — the manifest is sacred");
});
