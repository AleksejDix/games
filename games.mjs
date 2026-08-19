// ============================================================================
// games.mjs — the catalog MANIFEST: the single registration point.
//
// Adding a game used to mean touching four files (folder, catalog card,
// vite input, test glob). Now it's the folder plus one entry here — this
// file drives:
//   - the catalog page's cards        (catalog.mjs)
//   - the production build's entries  (vite.config.mjs)
// Tests need no registration at all: `node --test` auto-discovers every
// **/*.test.mjs in the repo.
//
// live: false renders a dashed "coming soon" teaser instead of a link.
//
// genre is filter data for the catalog's shell UI — the dropdowns derive
// their options from whatever genres exist here.
// ============================================================================

export const GAMES = [
  {
    id: "snake",
    thumb: { width: 420, height: 420, ticks: 30, options: { cols: 21, rows: 21, wrap: true } },
    genre: "grid",
    title: "SNAKE",
    year: 1976,
    blurb:
      "Grid movement, input buffering, wrap-around walls, timed bonus food. Pure tested core, canvas shell.",
    live: true,
  },
  {
    id: "pong",
    thumb: { width: 800, height: 500, ticks: 300 },
    genre: "paddle",
    title: "PONG",
    year: 1972,
    blurb:
      "Continuous motion, angle-of-incidence bounces, a beatable AI paddle. Same tested core, now with floats.",
    live: true,
  },
  {
    id: "breakout",
    thumb: { width: 480, height: 560, ticks: 0 },
    genre: "paddle",
    title: "BREAKOUT",
    year: 1976,
    blurb:
      "Pong turned solo: a wall of bricks, AABB collision, lives, and a win condition. Aim with the paddle edges.",
    live: true,
  },
  {
    id: "asteroids",
    thumb: { width: 640, height: 480, ticks: 240 },
    genre: "shooter",
    title: "ASTEROIDS",
    year: 1979,
    blurb:
      "Rotation, thrust, and inertia on a wrapping torus. Vector rendering with canvas transforms, rocks that split, endless waves.",
    live: true,
  },
  {
    id: "invaders",
    thumb: { width: 600, height: 600, ticks: 500 },
    genre: "shooter",
    title: "SPACE INVADERS",
    year: 1978,
    blurb:
      "A fleet marching in lockstep that accelerates as it thins, one laser at a time, raining bombs, crumbling bunkers.",
    live: true,
  },
  {
    id: "lander",
    thumb: { width: 640, height: 480, ticks: 180 },
    genre: "physics",
    title: "LUNAR LANDER",
    year: 1979,
    blurb:
      "Gravity against a fuel budget: tilt, burn, and touch down gently on level ground. The first game won by stopping.",
    live: true,
  },
  {
    id: "racer",
    thumb: { width: 480, height: 640, ticks: 400 },
    genre: "racing",
    title: "RACER",
    year: 1976,
    blurb:
      "Checkpoint racing down an endless curving highway — gas, brake, and traffic to slip past. Beat the clock, nothing else can stop you.",
    live: true,
  },
  {
    id: "missiles",
    thumb: { width: 640, height: 480, ticks: 900 },
    genre: "shooter",
    title: "MISSILE COMMAND",
    year: 1980,
    blurb:
      "The first pointer game: aim, click, and blanket the sky with fireballs. Six cities, never rebuilt. Everything ends.",
    live: true,
  },
  {
    id: "tetris",
    genre: "puzzle",
    title: "TETRIS",
    year: 1985,
    blurb: "Falling tetrominoes, rotation systems, line clears.",
    live: false,
  },
];

// The catalog's filter — pure data logic, tested in games.test.mjs; the
// DOM in catalog.mjs only calls it. "all" is the dropdowns' neutral value.
export function filterGames(games, { query = "", genre = "all", year = "all" } = {}) {
  const q = query.trim().toLowerCase();
  return games.filter(
    (g) =>
      (q === "" ||
        g.title.toLowerCase().includes(q) ||
        g.blurb.toLowerCase().includes(q)) &&
      (genre === "all" || g.genre === genre) &&
      (year === "all" || String(g.year) === String(year))
  );
}
