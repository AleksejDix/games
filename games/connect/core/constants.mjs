// Tuning values — though Connect Four barely has any: the 7×6 rack and
// the two colors are the whole physics. Milton Bradley's 1974 rules:
// discs drop, gravity stacks them, four in a row wins.

export const COLS = 7;
export const ROWS = 6;

export const SIDES = ["red", "gold"]; // red drops first

// The machine tries the middle first — center columns touch the most
// four-in-a-rows, so good moves surface early and alpha-beta prunes hard.
export const CENTER_OUT = [3, 2, 4, 1, 5, 0, 6];

// Every four-in-a-row the rack can hold, precomputed once as index
// quadruples: 24 horizontals, 21 verticals, 24 diagonals — 69 lines.
// OXO's pattern, scaled up: the win check is a lookup, not a search.
export const LINES = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    if (c + 3 < COLS) LINES.push([i, i + 1, i + 2, i + 3]);
    if (r + 3 < ROWS) LINES.push([i, i + COLS, i + COLS * 2, i + COLS * 3]);
    if (c + 3 < COLS && r + 3 < ROWS)
      LINES.push([i, i + COLS + 1, i + COLS * 2 + 2, i + COLS * 3 + 3]);
    if (c - 3 >= 0 && r + 3 < ROWS)
      LINES.push([i, i + COLS - 1, i + COLS * 2 - 2, i + COLS * 3 - 3]);
  }
}

// The lines through each cell — so a fresh drop checks only the lines it
// could possibly have completed, not all 69.
export const LINES_AT = Array.from({ length: ROWS * COLS }, (_, i) =>
  LINES.filter((line) => line.includes(i))
);
