// Tuning values, and the seven tetrominoes themselves — drawn as string
// art per rotation state, parsed once into cell offsets. Rotations are
// listed clockwise; pieces with symmetry list only their distinct states.

export const WELL = { cols: 10, rows: 20 };

export const GRAVITY = {
  start: 800, // ms per row on level 1...
  perLevel: 65, // ...harried per level...
  min: 90, // ...down to the terminal hurry
};

export const SCORING = {
  // NES line values, multiplied by the level: the TETRIS pays 30× a single.
  lines: [0, 40, 100, 300, 1200],
  softDrop: 1, // per row nudged
  hardDrop: 2, // per row plummeted
  linesPerLevel: 10,
};

// Kick offsets tried in order when a rotation collides — a simplified
// take on SRS wall kicks: shove sideways until it fits, or give up.
export const KICKS = [0, -1, 1, -2, 2];

const ART = {
  I: [
    ["....", "####", "....", "...."],
    ["..#.", "..#.", "..#.", "..#."],
  ],
  O: [[".##.", ".##.", "....", "...."]],
  T: [
    [".#.", "###", "..."],
    [".#.", ".##", ".#."],
    ["...", "###", ".#."],
    [".#.", "##.", ".#."],
  ],
  S: [
    [".##", "##.", "..."],
    [".#.", ".##", "..#"],
  ],
  Z: [
    ["##.", ".##", "..."],
    ["..#", ".##", ".#."],
  ],
  J: [
    ["#..", "###", "..."],
    [".##", ".#.", ".#."],
    ["...", "###", "..#"],
    [".#.", ".#.", "##."],
  ],
  L: [
    ["..#", "###", "..."],
    [".#.", ".#.", ".##"],
    ["...", "###", "#.."],
    ["##.", ".#.", ".#."],
  ],
};

// PIECES[type][rot] = array of [x, y] cell offsets.
export const PIECES = Object.fromEntries(
  Object.entries(ART).map(([type, rotations]) => [
    type,
    rotations.map((rows) =>
      rows.flatMap((row, y) =>
        [...row].flatMap((ch, x) => (ch === "#" ? [[x, y]] : []))
      )
    ),
  ])
);

export const TYPES = Object.keys(PIECES); // I O T S Z J L
