// ============================================================================
// logic.mjs — the FUNCTIONAL CORE
//
// Every game rule lives here as plain data-in/data-out code. There is no
// canvas, no keyboard, no timer, no DOM in this file — which is exactly why
// Node's built-in test runner can execute it (`node --test`).
//
// This split is called "functional core, imperative shell":
//   - logic.mjs = the rules (pure, deterministic, testable)
//   - game.mjs  = the shell (screen, keys, clock — hard to test, kept thin)
//
// Now an ES module (.mjs): each `export` below is the module's public API,
// and BOTH the browser and Node import it with the same syntax. Before ESM,
// this file needed an ugly wrapper that set a browser global AND a Node
// module.exports — two module systems, one hack. `export` replaces all that,
// and everything not exported is truly private to this file.
//
// One subtlety: random food placement would make tests flaky. So randomness
// is INJECTED — createState accepts a `random` function. The browser passes
// nothing (defaults to Math.random); tests pass a fake that returns known
// values. This trick is called dependency injection, and it's how you make
// any "unpredictable" thing (time, network, dice) testable.
// ============================================================================

// The bonus food. Its lifetime is measured in TICKS, not milliseconds —
// pure logic has no clock. The shell decides how long a tick lasts, so at
// the starting speed (130ms/tick) 40 ticks ≈ 5 real seconds.
export const BONUS = {
  every: 5, // a bonus appears after every 5th food...
  ttl: 40, // ...lives this many ticks...
  points: 5, // ...and is worth this many points
};

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function createState({ cols, rows, random = Math.random, wrap = false }) {
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
    stepMs: 130,
    status: "playing", // "playing" | "gameover"  (pausing is a UI concern)
  };
  state.food = spawnFood(state);
  return state;
}

export function spawnFood(state) {
  // Keep picking random cells until we find one the snake doesn't occupy.
  // Fine for a small grid; on a huge grid you'd pick from the free cells.
  while (true) {
    const cell = {
      x: Math.floor(state.random() * state.cols),
      y: Math.floor(state.random() * state.rows),
    };
    if (!state.snake.some((s) => s.x === cell.x && s.y === cell.y)) {
      return cell;
    }
  }
}

// Like spawnFood, but a bonus must also avoid the regular food's cell.
export function spawnBonus(state) {
  while (true) {
    const cell = {
      x: Math.floor(state.random() * state.cols),
      y: Math.floor(state.random() * state.rows),
    };
    const onSnake = state.snake.some((s) => s.x === cell.x && s.y === cell.y);
    const onFood = state.food.x === cell.x && state.food.y === cell.y;
    if (!onSnake && !onFood) {
      return { ...cell, ttl: BONUS.ttl };
    }
  }
}

// Buffer a direction wish; step() consumes one per tick. Capped so key
// mashing can't queue up seconds of stale turns.
export function queueDirection(state, dir) {
  if (state.inputQueue.length < 3) state.inputQueue.push(dir);
}

// Advance the simulation by exactly one tick.
// Returns what happened — "moved" | "ate" | "died" | null — so the shell
// can react (sounds, saving the high score) without knowing the rules.
export function step(state) {
  if (state.status !== "playing") return null;

  // Time passes first: the bonus ages before anything moves, so a bonus on
  // its last tick (ttl 1) expires before the snake could reach it.
  if (state.bonus && --state.bonus.ttl === 0) {
    state.bonus = null;
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
    state.status = "gameover";
    return "died";
  }

  // The classic snake trick: moving = add a new head, remove the tail.
  // Growing = add a new head, KEEP the tail. No cell ever "moves".
  state.snake.unshift(newHead);

  if (newHead.x === state.food.x && newHead.y === state.food.y) {
    state.score += 1;
    state.food = spawnFood(state);
    // Speed up with each food, with a floor so it stays playable.
    state.stepMs = Math.max(60, state.stepMs - 2);
    // Every BONUS.every-th meal puts a timed bonus on the board.
    if (state.score % BONUS.every === 0) {
      state.bonus = spawnBonus(state);
    }
    return "ate";
  }

  if (
    state.bonus &&
    newHead.x === state.bonus.x &&
    newHead.y === state.bonus.y
  ) {
    state.score += BONUS.points;
    state.bonus = null;
    return "ateBonus"; // tail kept — a bonus grows the snake like any meal
  }

  state.snake.pop();
  return "moved";
}
