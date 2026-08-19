// The shape of the world: a parsed warehouse. Walls and goals are flat
// boolean grids (index = row * cols + col), the boxes an index list, the
// keeper a single index — plain serializable values throughout, so a
// snapshot of the state IS the state.

import { LEVELS } from "./levels.mjs";

// Decode the standard notation (the legend lives in levels.mjs). Rows
// may be ragged in the source; short rows pad out with floor, so the
// grid is always a perfect rectangle.
export function parseLevel(rows) {
  const cols = Math.max(...rows.map((row) => row.length));
  const walls = [];
  const goals = [];
  const boxes = [];
  let keeper = -1;
  rows.forEach((row, r) => {
    [...row.padEnd(cols, " ")].forEach((ch, c) => {
      const i = r * cols + c;
      walls[i] = ch === "#";
      goals[i] = ch === "." || ch === "*" || ch === "+";
      if (ch === "$" || ch === "*") boxes.push(i);
      if (ch === "@" || ch === "+") keeper = i;
    });
  });
  return { cols, rows: rows.length, walls, goals, boxes, keeper };
}

// Solved is a property of the whole floor at once: every box on a goal.
export const isSolved = (state) => state.boxes.every((box) => state.goals[box]);

export function createState({ random = Math.random, level = 0 } = {}) {
  return {
    ...parseLevel(LEVELS[level]),
    level,
    random, // stored for the contract; a warehouse rolls no dice
    facing: "down", // cosmetic — which way the keeper's notch points
    moves: 0,
    pushes: 0,
    history: [], // one record per step: the undo stack
    status: "playing",
  };
}
