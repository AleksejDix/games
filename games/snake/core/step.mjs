// The heart of the game: advancing the simulation by one tick.

import { BONUS } from "./constants.mjs";
import { spawnFood, spawnBonus } from "./spawn.mjs";
import { transition } from "./machine.mjs";

// Buffer a direction wish; step() consumes one per tick. Capped so key
// mashing can't queue up seconds of stale turns.
export function queueDirection(state, dir) {
  if (state.inputQueue.length < 3) state.inputQueue.push(dir);
}

// Advance the simulation by exactly one tick.
//
// Returns EVENTS AS DATA: an array of { type, ...payload } objects listing
// everything that happened, in the order it happened. An empty array is an
// uneventful tick. The array form matters because one tick can hold two
// facts (a bonus expiring AND food being eaten), and the payloads carry
// what the shell would otherwise re-derive from state (how the snake died,
// what the bonus paid). The shell reacts — sounds, high scores — without
// knowing a single rule.
export function step(state) {
  if (state.status !== "playing") return [];

  const events = [];

  // Time passes first: the bonus ages before anything moves, so a bonus on
  // its last tick (ttl 1) expires before the snake could reach it.
  if (state.bonus && --state.bonus.ttl === 0) {
    state.bonus = null;
    events.push({ type: "bonusExpired" });
  }

  // Consume one buffered direction, rejecting 180° reversals — the snake
  // can't turn back into its own neck. Two directions are opposite
  // exactly when their sum is the zero vector.
  while (state.inputQueue.length > 0) {
    const next = state.inputQueue.shift();
    const isReversal =
      next.x + state.dir.x === 0 && next.y + state.dir.y === 0;
    if (!isReversal) {
      state.dir = next;
      break; // one turn per tick; leftover wishes wait for the next tick
    }
  }

  const head = state.snake[0];
  const newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

  if (state.wrap) {
    // Torus world: stepping off one edge re-enters on the opposite side.
    // The `+ cols` before the modulo matters — in JS, -1 % 10 is -1, not 9.
    newHead.x = (newHead.x + state.cols) % state.cols;
    newHead.y = (newHead.y + state.rows) % state.rows;
  }

  // Collision: walls (only exist in non-wrap mode — wrapped coordinates
  // above are always in bounds)...
  const hitWall =
    !state.wrap &&
    (newHead.x < 0 ||
      newHead.x >= state.cols ||
      newHead.y < 0 ||
      newHead.y >= state.rows);
  // ...or the snake's own body. The tail tip is skipped: it will have
  // moved away by the time the head arrives.
  const hitSelf = state.snake
    .slice(0, -1)
    .some((s) => s.x === newHead.x && s.y === newHead.y);

  if (hitWall || hitSelf) {
    transition(state, "gameover");
    events.push({ type: "died", cause: hitWall ? "wall" : "self" });
    return events;
  }

  // The classic snake trick: moving = add a new head, remove the tail.
  // Growing = add a new head, KEEP the tail. No cell ever "moves".
  state.snake.unshift(newHead);

  if (newHead.x === state.food.x && newHead.y === state.food.y) {
    state.score += 1;
    // Speed up with each food, with a floor so it stays playable.
    state.stepMs = Math.max(60, state.stepMs - 2);
    events.push({ type: "ate" });

    // Count the empty cells BEFORE spawning anything: the spawners
    // rejection-sample, and on a board with no free cell they would loop
    // forever. The snake just grew into the food's cell, so what's free
    // is simply board minus body.
    const free = state.cols * state.rows - state.snake.length;
    if (free === 0) {
      // The snake IS the board — total victory.
      transition(state, "cleared");
      events.push({ type: "cleared" });
      return events;
    }

    state.food = spawnFood(state);
    // Every BONUS.every-th meal puts a timed bonus on the board — but a
    // bonus needs a SECOND free cell (the new food just claimed one), and
    // a live bonus keeps its place and its clock: silently swapping it
    // would refresh the ttl and skip the bonusExpired the shell's fizzle
    // sound is promised. One bonus at a time, first come served.
    if (!state.bonus && state.score % BONUS.every === 0 && free > 1) {
      state.bonus = spawnBonus(state);
    }
    return events;
  }

  if (
    state.bonus &&
    newHead.x === state.bonus.x &&
    newHead.y === state.bonus.y
  ) {
    state.score += BONUS.points;
    state.bonus = null;
    // Tail kept — a bonus grows the snake like any meal.
    events.push({ type: "ateBonus", points: BONUS.points });
    return events;
  }

  state.snake.pop();
  return events;
}
