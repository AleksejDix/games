// The shape of the world: nine cells and whose turn it is. The `cells`
// option seeds a position — the thumbnail uses it for a mid-game board,
// and tests use it to stage scenarios.

export function createState({ random = Math.random, cells = null } = {}) {
  const board = cells ? [...cells] : Array(9).fill(null);
  const placed = (mark) => board.filter((c) => c === mark).length;
  return {
    random, // unused by the rules — OXO is the catalog's first game of pure skill
    cells: board,
    turn: placed("X") > placed("O") ? "O" : "X", // X always starts
    winner: null,
    line: null, // the winning triple, for the renderer's strike-through
    status: "playing",
  };
}
