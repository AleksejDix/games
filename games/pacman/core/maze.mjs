// ============================================================================
// maze.mjs — the board, as strings you can read.
//
// Our own maze (the 1980 layout stays Namco's), but the classic GRAMMAR is
// honored: 21×23, mirror-symmetric left to right, one tunnel row wrapping
// the sides, a central ghost house with a one-way door, four power pellets
// in the corners, pellets down every corridor, and — like the original —
// not a single dead end, so a ghost only ever reverses when the rules
// force it to.
//
//   '#' wall     '.' pellet      'o' power pellet   ' ' bare corridor
//   '-' ghost door               'G' ghost-house interior
//   'P' pac's starting cell
//
// The test suite validates all of the grammar (symmetry, the tunnel, the
// four powers, flood-fill reachability) straight off these strings.
// ============================================================================

export const MAZE = [
  "#####################",
  "#o........#........o#",
  "#.###.###.#.###.###.#",
  "#.###.###.#.###.###.#",
  "#...................#",
  "#.##.#.#######.#.##.#",
  "#.##.#.#######.#.##.#",
  "#.##.#.#######.#.##.#",
  "#...................#",
  "#######.##-##.#######",
  "       .#GGG#.       ",
  "#######.#####.#######",
  "#...................#",
  "#.###.#.#####.#.###.#",
  "#.###.#.#####.#.###.#",
  "#.........P.........#",
  "#.#.###.#####.###.#.#",
  "#.#.###.#####.###.#.#",
  "#...................#",
  "#.###.###.#.###.###.#",
  "#.###.###.#.###.###.#",
  "#o........#........o#",
  "#####################",
];

export const COLS = MAZE[0].length; // 21
export const ROWS = MAZE.length; // 23

// Cells live in Sets keyed as "x,y" — O(1) eating, trivially countable.
export const key = (x, y) => `${x},${y}`;

// The tile under a coordinate, with the tunnel built in: x wraps around
// the sides, so "one cell left of column 0" IS column 20. Off the top or
// bottom there is no world — treat it as wall.
export function tileAt(x, y) {
  if (y < 0 || y >= ROWS) return "#";
  return MAZE[y][((x % COLS) + COLS) % COLS];
}

// May a mover stand on this cell? Everyone walks corridors; only EYES may
// pass the door and the house interior — that is what makes the door
// one-way: a living ghost leaves by script and can never path back in.
export function passable(x, y, { eyes = false } = {}) {
  const tile = tileAt(x, y);
  if (tile === "#") return false;
  if (tile === "-" || tile === "G") return eyes;
  return true;
}

// Read the board's landmarks and consumables off the strings. Called per
// game (and per level refill): the Sets are eaten during play, so each
// world needs fresh ones — the strings themselves are never mutated.
export function parseMaze() {
  const pellets = new Set();
  const powers = new Set();
  const house = [];
  let pacStart = null;
  let door = null;
  let tunnelRow = -1;

  MAZE.forEach((row, y) => {
    if (row[0] === " " && row[COLS - 1] === " ") tunnelRow = y;
    [...row].forEach((tile, x) => {
      if (tile === ".") pellets.add(key(x, y));
      if (tile === "o") powers.add(key(x, y));
      if (tile === "G") house.push({ x, y });
      if (tile === "-") door = { x, y };
      if (tile === "P") pacStart = { x, y };
    });
  });

  return { pellets, powers, house, door, pacStart, tunnelRow };
}
