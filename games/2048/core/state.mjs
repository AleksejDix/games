// The shape of the world: sixteen numbers, 0 for empty. `top` remembers
// the highest tile reached, so a new summit can be announced once.

import { BOARD } from "./constants.mjs";
import { pick } from "../../../shared/random.mjs";

export function spawnTile(state) {
  const empties = state.cells.flatMap((c, i) => (c === 0 ? [i] : []));
  if (empties.length === 0) return -1;
  const index = pick(empties, state.random);
  state.cells[index] = state.random() < BOARD.fourChance ? 4 : 2;
  return index; // announced as an event — the shell pops it in after the tween
}

export function createState({ random = Math.random } = {}) {
  const state = {
    random,
    cells: Array(BOARD.size * BOARD.size).fill(0),
    score: 0,
    top: 0,
    anim: null, // cosmetic: the shell's slide tween parks here (rules ignore it)
    status: "playing",
  };
  spawnTile(state);
  spawnTile(state);
  return state;
}
