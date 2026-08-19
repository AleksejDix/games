// ============================================================================
// games.mjs — the catalog MANIFEST: the single registration point.
//
// Adding a game means the folder plus one entry here — this file drives
// the catalog page's cards (catalog.mjs). There is no build to register
// with: the app is build-less, the source IS the site (see serve.mjs).
// Tests need no registration either: `node --test` auto-discovers every
// **/*.test.mjs in the repo.
//
// live: false renders a dashed "coming soon" teaser instead of a link.
//
// harness (optional) tells the conformance suite how to boot the core:
// createState options plus random values that terminate any sampling.
// The default — no options, a cycling 0.5 — suits most games.
//
// genre is filter data for the catalog's shell UI — the dropdowns derive
// their options from whatever genres exist here.
//
// record (optional) describes the best score the game's shell persists,
// so the catalog's cards and the records view can read it back:
//   { unit: "points" }                highest wins, key `<id>Best`
//   { fewest: "pegs" }                lowest wins, key `<id>Best`
//   { fewest: "moves", variants: "pairs" }
//                                     lowest wins, one key per variant:
//                                     `<id>Best.<n>` (n = pairs, size, …)
// No record field = the game keeps none (Pong is two-player, OXO never
// loses, Mines has no timer yet). inputs lists how a game
// is PLAYABLE — keyboard, mouse, touch — honestly (Minesweeper has no
// touch story: flags need right-click), so a phone can filter for what
// its screen can actually play (Minesweeper earned touch with a
// long-press flag gesture).
//
// modes lists who can play: every game is "solo"; "versus" marks a real
// two-player mode on one machine (Pong's second paddle, OXO's second
// human, Memory's Pelmanism rule) — the sidebar's players filter.
// ============================================================================

export const GAMES = [
  {
    id: "snake",
    inputs: ["keyboard", "touch"],
    modes: ["solo"],
    thumb: { width: 420, height: 420, ticks: 30, options: { cols: 21, rows: 21, wrap: true } },
    harness: { options: { cols: 10, rows: 10 }, randomValues: [0, 0] },
    genre: "grid",
    title: "SNAKE",
    year: 1976,
    blurb:
      "Grid movement, input buffering, wrap-around walls, timed bonus food. Pure tested core, canvas shell.",
    record: { unit: "points" },
    live: true,
  },
  {
    id: "pong",
    inputs: ["keyboard", "touch"],
    modes: ["solo", "versus"],
    thumb: { width: 800, height: 500, ticks: 300 },
    genre: "paddle",
    title: "PONG",
    year: 1972,
    blurb:
      "Continuous motion, angle-of-incidence bounces, a beatable AI paddle or a second player on one keyboard. Same tested core, now with floats.",
    live: true,
  },
  {
    id: "breakout",
    inputs: ["keyboard", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 560, ticks: 0 },
    genre: "paddle",
    title: "BREAKOUT",
    year: 1976,
    blurb:
      "Pong turned solo: a wall of bricks, AABB collision, lives, and a win condition. Aim with the paddle edges.",
    record: { unit: "points" },
    live: true,
  },
  {
    id: "asteroids",
    inputs: ["keyboard"], // turn+thrust+fire at once — thumbs need not apply
    modes: ["solo"],
    thumb: { width: 640, height: 480, ticks: 240 },
    genre: "shooter",
    title: "ASTEROIDS",
    year: 1979,
    blurb:
      "Rotation, thrust, and inertia on a wrapping torus. Vector rendering with canvas transforms, rocks that split, endless waves.",
    record: { unit: "points" },
    live: true,
  },
  {
    id: "invaders",
    inputs: ["keyboard", "touch"],
    modes: ["solo"],
    thumb: { width: 600, height: 600, ticks: 500 },
    genre: "shooter",
    title: "SPACE INVADERS",
    year: 1978,
    blurb:
      "A fleet marching in lockstep that accelerates as it thins, one laser at a time, raining bombs, crumbling bunkers.",
    record: { unit: "points" },
    live: true,
  },
  {
    id: "lander",
    inputs: ["keyboard", "touch"],
    modes: ["solo"],
    thumb: { width: 640, height: 480, ticks: 180 },
    genre: "physics",
    title: "LUNAR LANDER",
    year: 1979,
    blurb:
      "Gravity against a fuel budget: tilt, burn, and touch down gently on level ground. The first game won by stopping.",
    record: { unit: "fuel" },
    live: true,
  },
  {
    id: "racer",
    inputs: ["keyboard", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 640, ticks: 400 },
    genre: "racing",
    title: "RACER",
    year: 1976,
    blurb:
      "Checkpoint racing down an endless curving highway — gas, brake, and traffic to slip past. Beat the clock, nothing else can stop you.",
    record: { unit: "points" },
    live: true,
  },
  {
    id: "missiles",
    inputs: ["mouse", "touch"],
    modes: ["solo"],
    thumb: { width: 640, height: 480, ticks: 900 },
    genre: "shooter",
    title: "MISSILE COMMAND",
    year: 1980,
    blurb:
      "The first pointer game: aim, click, and blanket the sky with fireballs. Six cities, never rebuilt. Everything ends.",
    record: { unit: "points" },
    live: true,
  },
  {
    id: "fifteen",
    inputs: ["keyboard", "mouse", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 480, ticks: 0 },
    genre: "puzzle",
    title: "FIFTEEN",
    year: 1880,
    blurb:
      "The original sliding-tile puzzle, a century before arcades — and the catalog's first turn-based game: no clock, no loop, just moves.",
    record: { fewest: "moves", variants: "size" },
    live: true,
  },
  {
    id: "oxo",
    inputs: ["mouse", "touch"],
    modes: ["solo", "versus"],
    thumb: { width: 480, height: 480, ticks: 0, options: { cells: ["X", "O", null, null, "X", "O", null, null, null] } },
    genre: "strategy",
    title: "OXO",
    year: 1952,
    blurb:
      "Noughts and crosses on the Cambridge EDSAC — arguably the first graphical computer game ever. The machine plays perfect minimax; it has never lost.",
    live: true,
  },
  {
    id: "memory",
    inputs: ["mouse", "touch"],
    modes: ["solo", "versus"],
    thumb: { width: 480, height: 480, ticks: 0 },
    genre: "puzzle",
    title: "MEMORY",
    year: 1913,
    blurb:
      "Pelmanism, the parlor test of recall: flip, remember, match, solo or head-to-head where a match keeps your turn. The board hides its state; the real game plays in your head.",
    record: { fewest: "moves", variants: "pairs" },
    live: true,
  },
  {
    id: "tetris",
    inputs: ["keyboard", "touch"],
    modes: ["solo"],
    thumb: { width: 380, height: 480, ticks: 80 },
    genre: "puzzle",
    title: "TETRIS",
    year: 1985,
    blurb:
      "The finale: seven tetrominoes, wall kicks, a seven-bag deal, gravity that hurries with every level — and a well that always wins in the end.",
    record: { unit: "points" },
    live: true,
  },
  {
    id: "simon",
    inputs: ["mouse", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 480, ticks: 0 },
    genre: "memory",
    title: "SIMON",
    year: 1978,
    blurb:
      "Four pads, four tones, and a sequence that lives only in your head. Sound is not the feedback — sound IS the game.",
    record: { unit: "rounds" },
    live: true,
  },
  {
    id: "lightsout",
    inputs: ["mouse", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 480, ticks: 0 },
    harness: { randomValues: [0.3, 0.7, 0.1] },
    genre: "puzzle",
    title: "LIGHTS OUT",
    year: 1995,
    blurb:
      "Tap a lamp, toggle its cross, reach total darkness. Secretly linear algebra: press order never matters.",
    record: { fewest: "moves", variants: "scrambles" },
    live: true,
  },
  {
    id: "whac",
    inputs: ["mouse", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 560, ticks: 300 },
    genre: "reflex",
    title: "WHAC-A-MOLE",
    year: 1976,
    blurb:
      "The carnival cabinet: thirty seconds, nine holes, purple optimists. No mole can hurt you — only escape you.",
    record: { unit: "moles" },
    live: true,
  },
  {
    id: "copter",
    inputs: ["keyboard", "mouse", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 360, ticks: 0 },
    genre: "reflex",
    title: "CAVE COPTER",
    year: 1998,
    blurb:
      "The one-button cave flyer: hold to rise, release to fall, survive the squeeze. Flappy's sibling — a force, not an impulse.",
    record: { unit: "m" },
    live: true,
  },
  {
    id: "flappy",
    inputs: ["keyboard", "mouse", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 640, ticks: 0 },
    genre: "reflex",
    title: "FLAPPY",
    year: 2013,
    blurb:
      "One button, merciless gravity, an unreasonable gap. The newest game in the catalog and the fastest to say oof.",
    record: { unit: "pipes" },
    live: true,
  },
  {
    id: "peg",
    inputs: ["mouse", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 480, ticks: 0 },
    genre: "puzzle",
    title: "PEG SOLITAIRE",
    year: 1697,
    blurb:
      "From the court of Louis XIV — the oldest game on the shelf. Jump, and the vaulted peg is lost; perfection is one peg, dead center.",
    record: { fewest: "pegs" },
    live: true,
  },
  {
    id: "frogger",
    inputs: ["keyboard", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 520, ticks: 200 },
    genre: "reflex",
    title: "FROGGER",
    year: 1981,
    blurb:
      "Two worlds in one crossing: a road where touching kills, a river where NOT touching kills — and logs that carry you, the first moving platforms.",
    record: { unit: "points" },
    live: true,
  },
  {
    id: "mines",
    inputs: ["mouse", "touch"], // long-press plants the flag
    modes: ["solo"],
    thumb: { width: 480, height: 480, ticks: 0 },
    genre: "puzzle",
    title: "MINESWEEPER",
    year: 1989,
    blurb:
      "Honest numbers, dishonest silence. The first dig is always safe, zeros flood open, flags are beliefs — only reveals are facts.",
    live: true,
  },
  {
    id: "2048",
    inputs: ["keyboard", "touch"],
    modes: ["solo"],
    thumb: { width: 480, height: 480, ticks: 0 },
    genre: "puzzle",
    title: "2048",
    year: 2014,
    blurb:
      "Slide, merge, double — the newest game on the shelf. Each tile merges once per move, and the end comes only when the board is full and silent.",
    record: { unit: "points" },
    live: true,
  },
];

// The catalog's filter — pure data logic, tested in games.test.mjs; the
// DOM in catalog.mjs only calls it. "all" is the dropdowns' neutral value.
export function filterGames(
  games,
  { query = "", genre = "all", year = "all", input = "all", mode = "all" } = {}
) {
  const q = query.trim().toLowerCase();
  return games.filter(
    (g) =>
      (q === "" ||
        g.title.toLowerCase().includes(q) ||
        g.blurb.toLowerCase().includes(q)) &&
      (genre === "all" || g.genre === genre) &&
      (year === "all" || String(g.year) === String(year)) &&
      (input === "all" || g.inputs.includes(input)) &&
      (mode === "all" || g.modes.includes(mode))
  );
}

// The catalog's sort — like the filter, pure and tested; the shell only
// calls it. "shelf" (the default) keeps manifest order; ties in the year
// sorts break by name so the order is stable and total.
export function sortGames(games, sort = "shelf") {
  const byName = (a, b) => a.title.localeCompare(b.title);
  const orders = {
    name: byName,
    oldest: (a, b) => a.year - b.year || byName(a, b),
    newest: (a, b) => b.year - a.year || byName(a, b),
  };
  return orders[sort] ? [...games].sort(orders[sort]) : [...games];
}
