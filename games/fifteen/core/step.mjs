// The actions of a TURN-BASED world. There is no simulation here — the
// world changes only when the player slides a tile.

import { neighbors, isSolved } from "./state.mjs";
import { transition } from "./machine.mjs";

// step() exists because the shell↔core contract promises one — and for a
// turn-based game the honest implementation is a no-op: the clock may
// tick, but time does nothing to this world. (This is the game that
// proves the engine's session/clock split: it runs on a bare session.)
export function step() {
  return [];
}

// The one verb: slide the tile at `index` into the gap, if they're
// adjacent. Illegal attempts are free — no move counted, no event.
export function slide(state, index) {
  if (state.status !== "playing") return [];
  const gap = state.tiles.indexOf(0);
  if (!neighbors(state, gap).includes(index)) return [];

  const tile = state.tiles[index];
  state.tiles[gap] = tile;
  state.tiles[index] = 0;
  state.moves += 1;

  const events = [{ type: "slid", tile }];
  if (isSolved(state.tiles)) {
    transition(state, "solved");
    events.push({ type: "solved", moves: state.moves });
  }
  return events;
}

// Keyboard semantics: the arrow names the TILE's movement. Pressing
// "left" slides the tile to the RIGHT of the gap leftward into it.
const SOURCES = {
  left: (gap, s) => (gap % s < s - 1 ? gap + 1 : -1),
  right: (gap, s) => (gap % s > 0 ? gap - 1 : -1),
  up: (gap, s) => (gap + s < s * s ? gap + s : -1),
  down: (gap, s) => (gap - s >= 0 ? gap - s : -1),
};

export function slideDirection(state, direction) {
  const source = SOURCES[direction];
  if (!source) return [];
  const index = source(state.tiles.indexOf(0), state.size);
  return index === -1 ? [] : slide(state, index);
}
