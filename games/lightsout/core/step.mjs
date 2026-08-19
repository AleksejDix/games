// One verb: toggle a cross. Everything else is consequences.

import { BOARD } from "./constants.mjs";
import { transition } from "./machine.mjs";

export function step() {
  return [];
}

// The cross: the cell and its in-bounds orthogonal neighbors.
export function flipCross(state, index) {
  const s = BOARD.size;
  const targets = [index];
  if (index % s > 0) targets.push(index - 1);
  if (index % s < s - 1) targets.push(index + 1);
  if (index - s >= 0) targets.push(index - s);
  if (index + s < s * s) targets.push(index + s);
  for (const i of targets) state.grid[i] = !state.grid[i];
}

export function toggle(state, index) {
  if (state.status !== "playing") return [];
  flipCross(state, index);
  state.moves += 1;
  const events = [{ type: "toggled", index }];
  if (state.grid.every((c) => !c)) {
    transition(state, "solved");
    events.push({ type: "solved", moves: state.moves });
  }
  return events;
}
