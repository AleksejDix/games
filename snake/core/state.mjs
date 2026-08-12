// The shape of the world. One plain object holds everything the rules need —
// no classes, no hidden fields, trivially inspectable and serializable.
//
// Randomness is INJECTED: createState accepts a `random` function. The
// browser passes nothing (defaults to Math.random); tests pass a fake that
// returns known values. This is dependency injection — how you make any
// "unpredictable" thing (time, network, dice) testable.

import { DIRS } from "./constants.mjs";
import { spawnFood } from "./spawn.mjs";

export function createState({
  cols,
  rows,
  random = Math.random,
  wrap = false,
  stepMs = 130, // starting tick length — the game's difficulty dial
}) {
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const state = {
    cols,
    rows,
    random,
    wrap, // true → edges teleport to the opposite side instead of killing
    // Index 0 is the head. Starts centered, 3 long, heading right.
    snake: [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ],
    dir: DIRS.right,
    inputQueue: [],
    food: null,
    bonus: null, // {x, y, ttl} while a bonus is on the board
    score: 0,
    stepMs,
    status: "playing", // "playing" | "gameover"  (pausing is a UI concern)
  };
  state.food = spawnFood(state);
  return state;
}
