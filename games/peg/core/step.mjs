// One verb: the jump. A peg vaults an adjacent peg into an empty hole,
// and the vaulted peg leaves the board.

import { SIZE } from "./constants.mjs";
import { transition } from "./machine.mjs";

export function step() {
  return [];
}

const DELTAS = [2, -2, 2 * SIZE, -2 * SIZE]; // two holes: right, left, down, up

const sameLine = (from, to) =>
  Math.abs(to - from) === 2
    ? Math.floor(from / SIZE) === Math.floor(to / SIZE) // horizontal stays in row
    : true;

const canJump = (state, from, to) =>
  state.board[from] === true &&
  state.board[to] === false &&
  DELTAS.includes(to - from) &&
  sameLine(from, to) &&
  state.board[(from + to) / 2] === true;

// Where may this peg go? The renderer hints with these.
export function legalTargets(state, from) {
  return DELTAS.map((d) => from + d).filter(
    (to) => to >= 0 && to < SIZE * SIZE && canJump(state, from, to)
  );
}

const anyMove = (state) =>
  state.board.some((cell, i) => cell === true && legalTargets(state, i).length > 0);

export function jump(state, from, to) {
  if (state.status !== "playing" || !canJump(state, from, to)) return [];

  state.board[from] = false;
  state.board[(from + to) / 2] = false; // the vaulted peg is gone
  state.board[to] = true;
  state.pegs -= 1;
  state.moves += 1;

  const events = [{ type: "jumped" }];
  if (state.pegs === 1) {
    transition(state, "solved");
    events.push({ type: "solved", pegs: 1, perfect: to === 3 * SIZE + 3 });
  } else if (!anyMove(state)) {
    transition(state, "stuck");
    events.push({ type: "stuck", pegs: state.pegs });
  }
  return events;
}
