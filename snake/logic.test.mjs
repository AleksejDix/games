// ============================================================================
// logic.test.mjs — run with:  node --test snake/*.test.mjs
//
// Uses only Node built-ins: node:test (the runner) and node:assert (the
// checks). No packages, no config. Note the imports: the test file pulls in
// logic.mjs with the exact same `import` the browser uses — one module
// system everywhere is the whole point of ESM.
//
// step() returns EVENTS AS DATA: an array of {type, ...payload} objects
// describing everything that happened this tick. An empty array means
// "nothing notable — the snake just moved". Arrays matter because two
// things can genuinely happen in one tick (see the bonus-expiry test).
//
// The pattern in every test is Arrange / Act / Assert:
//   arrange — build a state (often hand-placing the snake or food so the
//             situation we care about happens on the very next tick)
//   act     — call Snake.step() one or more times
//   assert  — check the state and events are what the rules promise
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Snake from "./logic.mjs";
import { fakeRandom } from "../shared/test-helpers.mjs";

// 10x10 grid → createState puts the head at (5,5), tail trailing left,
// moving right. Food is parked far away at (0,0) unless a test moves it.
function makeState() {
  return Snake.createState({
    cols: 10,
    rows: 10,
    random: fakeRandom(0.0, 0.0),
  });
}

test("moving adds a head and removes the tail — length stays constant", () => {
  const state = makeState();

  const events = Snake.step(state);

  assert.deepEqual(events, []); // an uneventful tick
  assert.deepEqual(state.snake[0], { x: 6, y: 5 });
  assert.equal(state.snake.length, 3);
});

test("eating food grows the snake and raises the score", () => {
  const state = makeState();
  state.food = { x: 6, y: 5 }; // directly in the head's path

  const events = Snake.step(state);

  assert.deepEqual(events, [{ type: "ate" }]);
  assert.equal(state.score, 1);
  assert.equal(state.snake.length, 4); // grew: tail was kept
});

test("a new food never spawns on the snake", () => {
  const state = makeState();
  // First random pair lands on the head (5,5) → must be rejected.
  // Second pair lands on the free cell (0,0) → accepted.
  state.random = fakeRandom(0.55, 0.55, 0.0, 0.0);

  const food = Snake.spawnFood(state);

  assert.deepEqual(food, { x: 0, y: 0 });
});

test("eating speeds the game up, but never past the 60ms floor", () => {
  const state = makeState();
  state.stepMs = 61;

  state.food = { x: 6, y: 5 };
  Snake.step(state);
  assert.equal(state.stepMs, 60); // 61 - 2 clamped to the floor

  state.food = { x: 7, y: 5 };
  Snake.step(state);
  assert.equal(state.stepMs, 60); // stays at the floor
});

test("hitting a wall ends the game", () => {
  const state = makeState();
  state.snake = [
    { x: 9, y: 5 }, // head on the last column, moving right
    { x: 8, y: 5 },
    { x: 7, y: 5 },
  ];

  const events = Snake.step(state);

  // The payload says HOW it died — the shell can react differently.
  assert.deepEqual(events, [{ type: "died", cause: "wall" }]);
  assert.equal(state.status, "gameover");
  assert.equal(state.snake.length, 3); // no head was added
});

test("running into your own body ends the game", () => {
  const state = makeState();
  // A hook shape: the head moving down will land on segment (5,6).
  state.snake = [
    { x: 5, y: 5 }, // head
    { x: 6, y: 5 },
    { x: 6, y: 6 },
    { x: 5, y: 6 }, // ← the head arrives here
    { x: 4, y: 6 },
  ];
  Snake.queueDirection(state, Snake.DIRS.down);

  const events = Snake.step(state);

  assert.deepEqual(events, [{ type: "died", cause: "self" }]);
  assert.equal(state.status, "gameover");
});

test("the tail tip does not count as a collision (it moves away)", () => {
  const state = makeState();
  // A tight 2x2 loop: the head chases its own tail tip. Legal, because the
  // tip vacates the cell in the same tick the head enters it.
  state.snake = [
    { x: 5, y: 5 }, // head, moving down will enter (5,6)...
    { x: 6, y: 5 },
    { x: 6, y: 6 },
    { x: 5, y: 6 }, // ...which is the tail tip → allowed
  ];
  Snake.queueDirection(state, Snake.DIRS.down);

  const events = Snake.step(state);

  assert.deepEqual(events, []);
  assert.equal(state.status, "playing");
});

test("the snake cannot reverse 180° into itself", () => {
  const state = makeState(); // moving right
  Snake.queueDirection(state, Snake.DIRS.left);

  Snake.step(state);

  // The reversal was discarded — still moving right.
  assert.deepEqual(state.snake[0], { x: 6, y: 5 });
});

test("two quick turns are buffered and applied one per tick", () => {
  const state = makeState(); // moving right
  // Player taps ↑ then ← between two ticks. With a single "latest key wins"
  // variable the ↑ would be lost; the queue preserves both.
  Snake.queueDirection(state, Snake.DIRS.up);
  Snake.queueDirection(state, Snake.DIRS.left);

  Snake.step(state);
  assert.deepEqual(state.snake[0], { x: 5, y: 4 }); // went up

  Snake.step(state);
  assert.deepEqual(state.snake[0], { x: 4, y: 4 }); // then left
});

test("the input buffer is capped at 3 wishes", () => {
  const state = makeState();

  for (let i = 0; i < 5; i++) Snake.queueDirection(state, Snake.DIRS.up);

  assert.equal(state.inputQueue.length, 3);
});

// ----------------------------------------------------------------------------
// Wrap-around walls — written TEST-FIRST. These describe behavior that does
// not exist yet: createState({ wrap: true }) should make edges teleport the
// snake to the opposite side instead of killing it. Watching these fail
// before implementing proves the tests are actually wired to something.
// ----------------------------------------------------------------------------

function makeWrapState() {
  return Snake.createState({
    cols: 10,
    rows: 10,
    random: fakeRandom(0.0, 0.0),
    wrap: true,
  });
}

test("wrap: leaving the right edge re-enters on the left", () => {
  const state = makeWrapState();
  state.snake = [
    { x: 9, y: 5 }, // head on the last column, moving right
    { x: 8, y: 5 },
    { x: 7, y: 5 },
  ];

  const events = Snake.step(state);

  assert.deepEqual(events, []);
  assert.deepEqual(state.snake[0], { x: 0, y: 5 });
  assert.equal(state.status, "playing");
});

test("wrap: leaving the left edge re-enters on the right", () => {
  const state = makeWrapState();
  state.snake = [
    { x: 0, y: 5 },
    { x: 1, y: 5 },
    { x: 2, y: 5 },
  ];
  state.dir = Snake.DIRS.left; // set directly: queueing ← while moving → would be a reversal

  Snake.step(state);

  assert.deepEqual(state.snake[0], { x: 9, y: 5 });
});

test("wrap: leaving the top edge re-enters at the bottom", () => {
  const state = makeWrapState();
  state.snake = [
    { x: 5, y: 0 },
    { x: 5, y: 1 },
    { x: 5, y: 2 },
  ];
  state.dir = Snake.DIRS.up;

  Snake.step(state);

  assert.deepEqual(state.snake[0], { x: 5, y: 9 });
});

test("wrap: leaving the bottom edge re-enters at the top", () => {
  const state = makeWrapState();
  state.snake = [
    { x: 5, y: 9 },
    { x: 5, y: 8 },
    { x: 5, y: 7 },
  ];
  state.dir = Snake.DIRS.down;

  Snake.step(state);

  assert.deepEqual(state.snake[0], { x: 5, y: 0 });
});

test("wrap: self-collision still ends the game", () => {
  const state = makeWrapState();
  state.snake = [
    { x: 5, y: 5 },
    { x: 6, y: 5 },
    { x: 6, y: 6 },
    { x: 5, y: 6 },
    { x: 4, y: 6 },
  ];
  Snake.queueDirection(state, Snake.DIRS.down);

  const events = Snake.step(state);

  assert.deepEqual(events, [{ type: "died", cause: "self" }]);
});

test("wrap is off by default — walls stay deadly unless asked for", () => {
  const state = makeState(); // no wrap option passed
  state.snake = [
    { x: 9, y: 5 },
    { x: 8, y: 5 },
    { x: 7, y: 5 },
  ];

  assert.deepEqual(Snake.step(state), [{ type: "died", cause: "wall" }]);
});

// ----------------------------------------------------------------------------
// Timed bonus food — written TEST-FIRST. The design problem: the bonus must
// expire "after a few seconds", but pure logic knows nothing about clocks.
// Solution: simulation time is measured in TICKS. The bonus carries a ttl
// (time-to-live) that step() counts down; the shell decides how long a tick
// is in real milliseconds. Tests just call step() N times — time, fully
// under test control.
// ----------------------------------------------------------------------------

test("every 5th food spawns a bonus with a full time-to-live", () => {
  const state = makeState();
  state.score = 4; // the next meal is the 5th
  state.food = { x: 6, y: 5 }; // directly in the head's path
  // Random sequence: food respawn takes (0,0); bonus placement takes (9,9).
  state.random = fakeRandom(0.0, 0.0, 0.95, 0.95);

  const events = Snake.step(state);

  assert.deepEqual(events, [{ type: "ate" }]);
  assert.equal(state.score, 5);
  assert.deepEqual(state.bonus, { x: 9, y: 9, ttl: Snake.BONUS.ttl });
});

test("ordinary foods do not spawn a bonus", () => {
  const state = makeState();
  state.food = { x: 6, y: 5 }; // 1st food, not a 5th

  Snake.step(state);

  assert.equal(state.bonus, null);
});

test("the bonus counts down each tick and expires at zero — with an event", () => {
  const state = makeState();
  state.bonus = { x: 0, y: 9, ttl: 2 };

  assert.deepEqual(Snake.step(state), []);
  assert.equal(state.bonus.ttl, 1);

  // Expiry is REPORTED, not silent — the shell can play a fizzle.
  assert.deepEqual(Snake.step(state), [{ type: "bonusExpired" }]);
  assert.equal(state.bonus, null);
});

test("eating the bonus scores extra, grows the snake, and clears it", () => {
  const state = makeState();
  state.bonus = { x: 6, y: 5, ttl: 10 }; // in the head's path

  const events = Snake.step(state);

  assert.deepEqual(events, [{ type: "ateBonus", points: Snake.BONUS.points }]);
  assert.equal(state.score, Snake.BONUS.points);
  assert.equal(state.snake.length, 4); // grew: tail was kept
  assert.equal(state.bonus, null);
  assert.deepEqual(state.food, { x: 0, y: 0 }); // regular food untouched
});

test("a regular meal while a bonus is out leaves the bonus ticking", () => {
  const state = makeState();
  state.food = { x: 6, y: 5 };
  state.bonus = { x: 9, y: 9, ttl: 5 };

  const events = Snake.step(state);

  assert.deepEqual(events, [{ type: "ate" }]);
  assert.deepEqual(state.bonus, { x: 9, y: 9, ttl: 4 }); // still there, one tick older
});

test("eating food on the very tick the bonus expires reports BOTH events", () => {
  // The reason events are an ARRAY: two things can happen in one tick, and
  // the old single-string API had to silently drop one of them.
  const state = makeState();
  state.food = { x: 6, y: 5 }; // in the head's path
  state.bonus = { x: 9, y: 9, ttl: 1 }; // about to expire

  const events = Snake.step(state);

  // Time passes first, so the expiry precedes the meal.
  assert.deepEqual(events, [{ type: "bonusExpired" }, { type: "ate" }]);
});

test("the bonus never spawns on the snake or on the food", () => {
  const state = makeState(); // food sits at (0,0)
  // (5,5) is the head → rejected; (0,0) is the food → rejected; (9,9) free.
  state.random = fakeRandom(0.55, 0.55, 0.0, 0.0, 0.95, 0.95);

  const bonus = Snake.spawnBonus(state);

  assert.deepEqual(bonus, { x: 9, y: 9, ttl: Snake.BONUS.ttl });
});

test("after game over, step() does nothing", () => {
  const state = makeState();
  state.status = "gameover";
  const before = structuredClone(state.snake);

  const events = Snake.step(state);

  assert.deepEqual(events, []);
  assert.deepEqual(state.snake, before);
});

// --- settings ----------------------------------------------------------------
// A "setting" is nothing exotic: just another createState parameter, like
// `wrap` always was. The core stays pure; the shell decides where the value
// comes from (a form, localStorage, ...).

test("createState accepts a custom starting speed", () => {
  const state = Snake.createState({
    cols: 10,
    rows: 10,
    random: fakeRandom(0.0, 0.0),
    stepMs: 170,
  });

  assert.equal(state.stepMs, 170);
});

test("a custom starting speed still accelerates per meal", () => {
  // A chill 170ms game should still accelerate per meal — from ITS baseline.
  const state = Snake.createState({
    cols: 10,
    rows: 10,
    random: fakeRandom(0.0, 0.0),
    stepMs: 170,
  });
  state.food = { x: 6, y: 5 };

  Snake.step(state);

  assert.equal(state.stepMs, 168);
});

// --- the status machine --------------------------------------------------------
// Snake's graph is tiny — two states, one transition — but it now runs on
// the same shared mechanism as every other game. The graph itself stays
// Snake's own data.

test("the status machine: dying is the only exit; restart is a new world", () => {
  const state = makeState();

  Snake.transition(state, "gameover");
  assert.equal(state.status, "gameover");

  // gameover is terminal — you don't transition back, you createState().
  assert.throws(
    () => Snake.transition(state, "playing"),
    /illegal status change/
  );
});

// --- winning ------------------------------------------------------------------
// The latent bug these tests exposed: spawnFood rejection-samples until it
// finds a free cell, so a FULL board would loop forever inside the game
// loop and freeze the tab. Filling the board is Snake's win condition —
// and it was missing entirely. A tiny 2×2 board makes "full" reachable in
// one bite.

test("filling the whole board wins the game", () => {
  const state = Snake.createState({ cols: 2, rows: 2, random: fakeRandom(0.0) });
  state.snake = [
    { x: 1, y: 0 }, // head — moving left onto the food fills the board
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  state.dir = Snake.DIRS.left;
  state.food = { x: 0, y: 0 };

  const events = Snake.step(state);

  assert.deepEqual(events, [{ type: "ate" }, { type: "cleared" }]);
  assert.equal(state.status, "cleared");
  assert.equal(state.snake.length, 4); // every cell of the 2×2 board
});

test("no bonus spawns when the board has no room for it", () => {
  const state = Snake.createState({ cols: 2, rows: 2, random: fakeRandom(0.0) });
  state.snake = [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ];
  state.dir = Snake.DIRS.left;
  state.food = { x: 0, y: 0 };
  state.score = Snake.BONUS.every - 1; // this meal would normally earn a bonus
  state.random = fakeRandom(0.0, 0.9); // food respawn → the only free cell (0,1)

  const events = Snake.step(state);

  assert.deepEqual(events, [{ type: "ate" }]);
  assert.deepEqual(state.food, { x: 0, y: 1 });
  assert.equal(state.bonus, null, "bonus skipped — no free cell left for it");
});
