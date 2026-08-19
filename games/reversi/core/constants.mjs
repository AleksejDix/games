// Tuning values — though reversi barely has any: the board, the two
// sides, and the eight directions a line can run. The whole game is one
// rule applied down those lines: a placed disc must FLANK enemy discs,
// and everything it flanks turns.

export const SIZE = 8;

export const SIDES = ["black", "white"]; // black moves first, as in 1883

// Every way a line leaves a square: the four ranks-and-files and the
// four diagonals, as [row, col] deltas.
export const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];
