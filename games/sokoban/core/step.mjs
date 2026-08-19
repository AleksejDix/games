// The actions of a TURN-BASED world. There is no simulation here — the
// warehouse changes only when the keeper takes a step, or takes one back.

import { DIRS } from "./constants.mjs";
import { isSolved } from "./state.mjs";
import { transition } from "./machine.mjs";

// step() exists because the shell↔core contract promises one — and for a
// turn-based game the honest implementation is a no-op: the clock may
// tick, but time does nothing to this world.
export function step() {
  return [];
}

// One vector step from `index`, or -1 off the grid. Every shipped level
// is walled all the way round, but arithmetic shouldn't trust art.
function shift(state, index, [dr, dc]) {
  const r = Math.floor(index / state.cols) + dr;
  const c = (index % state.cols) + dc;
  return r < 0 || r >= state.rows || c < 0 || c >= state.cols ? -1 : r * state.cols + c;
}

// The one verb: walk one cell, pushing exactly ONE box if the cell
// beyond it is free — never two in a row, never into a wall. Sokoban's
// whole depth lives in what this refuses. Illegal attempts are free: no
// move counted, no event, no history entry.
export function move(state, dir) {
  if (state.status !== "playing") return [];
  const delta = DIRS[dir];
  if (!delta) return [];

  const to = shift(state, state.keeper, delta);
  if (to === -1 || state.walls[to]) return [];

  // Every step remembers how to take itself back — the counters BEFORE
  // the step included, so undo restores exactly, not approximately.
  const record = {
    keeper: state.keeper,
    facing: state.facing,
    box: null,
    moves: state.moves,
    pushes: state.pushes,
  };
  const events = [{ type: "moved", dir }];

  const pushing = state.boxes.indexOf(to);
  if (pushing !== -1) {
    const beyond = shift(state, to, delta);
    if (beyond === -1 || state.walls[beyond] || state.boxes.includes(beyond)) return [];
    record.box = { index: pushing, from: to };
    state.boxes[pushing] = beyond;
    state.pushes += 1;
    events.push({ type: "pushed", index: pushing, from: to, to: beyond });
  }

  state.keeper = to;
  state.facing = dir;
  state.moves += 1;
  state.history.push(record);

  if (isSolved(state)) {
    transition(state, "solved");
    events.push({ type: "solved", moves: state.moves, pushes: state.pushes });
  } else if (record.box && deadBoxes(state).includes(state.boxes[pushing])) {
    // The push just killed its own crate — say so NOW, while the undo
    // that fixes it is one keypress deep.
    events.push({ type: "stuck", index: state.boxes[pushing] });
  }
  return events;
}

// A crate in a bare corner is DEAD: no push can ever free it, and off a
// goal it makes the room unwinnable. Full deadlock detection is famously
// hard; the corner check catches the everyday tragedy the moment it
// happens, so the shell can point at the crate — and the player can
// undo out, or restart — instead of pushing on in hope. The grid's edge
// counts as wall, like everywhere else in the rules.
export function deadBoxes(state) {
  const { cols, rows, walls, goals } = state;
  return state.boxes.filter((box) => {
    if (goals[box]) return false;
    const r = Math.floor(box / cols);
    const c = box % cols;
    const wall = (dr, dc) => {
      const rr = r + dr;
      const cc = c + dc;
      return rr < 0 || rr >= rows || cc < 0 || cc >= cols || walls[rr * cols + cc];
    };
    return (wall(-1, 0) || wall(1, 0)) && (wall(0, -1) || wall(0, 1));
  });
}

// Undo is free and unlimited — this is a puzzle about thinking, not
// punishment. Pop the last record; put the keeper (and the box, if that
// step pushed one) back; restore both counters. Past the start there is
// nothing to take back, and that's a quiet no-op.
export function undo(state) {
  if (state.status !== "playing") return [];
  const record = state.history.pop();
  if (!record) return [];
  state.keeper = record.keeper;
  state.facing = record.facing;
  if (record.box) state.boxes[record.box.index] = record.box.from;
  state.moves = record.moves;
  state.pushes = record.pushes;
  return [{ type: "undone" }];
}
