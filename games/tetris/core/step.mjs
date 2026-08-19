// The verbs of Tetris. Gravity arrives through step() on the engine's
// clock (stepMs shrinks per level, Snake's trick); everything else is a
// player action. All roads to the well go through lock().

import { WELL, PIECES, SCORING, KICKS } from "./constants.mjs";
import { pieceCells, fits, spawn, drawPiece, gravityMs } from "./state.mjs";
import { transition } from "./machine.mjs";
import { TYPES } from "./constants.mjs";

const typeIndex = (type) => TYPES.indexOf(type) + 1; // well cells remember who

// Merge the piece, clear full rows, score, level, spawn the next — and
// notice the only losing move: a spawn with nowhere to stand.
function lock(state) {
  const events = [{ type: "locked" }];

  for (const [x, y] of pieceCells(state.piece)) {
    if (y >= 0) state.well[y * WELL.cols + x] = typeIndex(state.piece.type);
  }

  // Sweep full rows; survivors fall by rebuilding the well without them.
  const rows = [];
  for (let y = 0; y < WELL.rows; y++) {
    const row = state.well.slice(y * WELL.cols, (y + 1) * WELL.cols);
    if (row.every(Boolean)) rows.push(y);
  }
  if (rows.length > 0) {
    for (const y of rows) {
      state.well.splice(y * WELL.cols, WELL.cols);
      state.well.unshift(...Array(WELL.cols).fill(0));
    }
    const points = SCORING.lines[rows.length] * state.level;
    state.score += points;
    state.lines += rows.length;
    events.push({ type: "cleared", rows: rows.length, points });

    const level = Math.floor(state.lines / SCORING.linesPerLevel) + 1;
    if (level > state.level) {
      state.level = level;
      state.stepMs = gravityMs(level); // gravity hurries — the engine reads this
      events.push({ type: "levelUp", level });
    }
  }

  state.piece = spawn(state.next);
  state.next = drawPiece(state);
  if (!fits(state, state.piece)) {
    transition(state, "gameover");
    events.push({ type: "died" });
  }
  return events;
}

const nudged = (piece, dx, dy, rot = piece.rot) => ({
  ...piece,
  x: piece.x + dx,
  y: piece.y + dy,
  rot,
});

// Gravity: down a row, or lock where it stands.
export function step(state) {
  if (state.status !== "playing") return [];
  state.tick += 1;
  const fallen = nudged(state.piece, 0, 1);
  if (fits(state, fallen)) {
    state.piece = fallen;
    return [];
  }
  return lock(state);
}

// The first piece key starts gravity — ready holds the opening piece in
// the air until the player reaches for the controls.
export function start(state) {
  if (state.status !== "ready") return [];
  transition(state, "playing");
  return [{ type: "started" }];
}

export function move(state, dx) {
  if (state.status !== "playing") return [];
  const moved = nudged(state.piece, dx, 0);
  if (fits(state, moved)) state.piece = moved;
  return [];
}

// Rotate clockwise, trying wall kicks in order: in place, then shoved
// one or two columns aside. Blocked entirely → nothing happens.
export function rotate(state) {
  if (state.status !== "playing") return [];
  const rot = (state.piece.rot + 1) % PIECES[state.piece.type].length;
  for (const kick of KICKS) {
    const turned = nudged(state.piece, kick, 0, rot);
    if (fits(state, turned)) {
      state.piece = turned;
      return [{ type: "rotated" }];
    }
  }
  return [];
}

// One row down, one point — or a lock if the floor is already here.
export function softDrop(state) {
  if (state.status !== "playing") return [];
  const fallen = nudged(state.piece, 0, 1);
  if (fits(state, fallen)) {
    state.piece = fallen;
    state.score += SCORING.softDrop;
    return [];
  }
  return lock(state);
}

// All the way down, two points a row, and the lock is immediate.
export function hardDrop(state) {
  if (state.status !== "playing") return [];
  let distance = 0;
  let falling = state.piece;
  let below = nudged(falling, 0, 1);
  while (fits(state, below)) {
    falling = below;
    below = nudged(falling, 0, 1);
    distance++;
  }
  state.piece = falling;
  state.score += SCORING.hardDrop * distance;
  return [{ type: "hardDrop", distance }, ...lock(state)];
}

// Where the piece would land — the renderer's ghost outline asks this.
export function ghostY(state) {
  let piece = state.piece;
  let below = nudged(piece, 0, 1);
  while (fits(state, below)) {
    piece = below;
    below = nudged(piece, 0, 1);
  }
  return piece.y;
}
