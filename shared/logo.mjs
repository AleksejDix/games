// The NEON GAMES mark: the catalog's most iconic sprite — the invader —
// drawn from its bitmap into SVG pixels. fill="currentColor" so CSS owns
// the color, and a drop-shadow filter provides the neon glow.

const BITMAP = [
  "..#.....#..",
  "...#...#...",
  "..#######..",
  ".##.###.##.",
  "###########",
  "#.#######.#",
  "#.#.....#.#",
  "...##.##...",
];

const pixels = BITMAP.flatMap((row, y) =>
  [...row].flatMap((ch, x) =>
    ch === "#" ? [`<rect x="${x}" y="${y}" width="1" height="1"/>`] : []
  )
).join("");

// The width/height attributes give the SVG an INTRINSIC size — with only
// a viewBox it defaults to 300×150 and wrecks whatever layout it lands in
// (as the topbar discovered).
export const LOGO = `<svg class="logo" width="26" height="19" viewBox="0 0 11 8" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${pixels}</svg>`;

export const BRAND = `${LOGO}<span class="word">NEON<b>GAMES</b></span>`;
