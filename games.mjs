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
// ============================================================================

export const GAMES = [
  {
    id: "snake",
    title: "SNAKE",
    year: 1976,
    blurb:
      "Grid movement, input buffering, wrap-around walls, timed bonus food. Pure tested core, canvas shell.",
    live: true,
  },
  {
    id: "pong",
    title: "PONG",
    year: 1972,
    blurb:
      "Continuous motion, angle-of-incidence bounces, a beatable AI paddle. Same tested core, now with floats.",
    live: true,
  },
  {
    id: "breakout",
    title: "BREAKOUT",
    year: 1976,
    blurb:
      "Pong turned solo: a wall of bricks, AABB collision, lives, and a win condition. Aim with the paddle edges.",
    live: true,
  },
  {
    id: "asteroids",
    title: "ASTEROIDS",
    year: 1979,
    blurb:
      "Rotation, thrust, and inertia on a wrapping torus. Vector rendering with canvas transforms, rocks that split, endless waves.",
    live: true,
  },
  {
    id: "invaders",
    title: "SPACE INVADERS",
    year: 1978,
    blurb:
      "A fleet marching in lockstep that accelerates as it thins, one laser at a time, raining bombs, crumbling bunkers.",
    live: true,
  },
  {
    id: "lander",
    title: "LUNAR LANDER",
    year: 1979,
    blurb:
      "Gravity against a fuel budget: tilt, burn, and touch down gently on level ground. The first game won by stopping.",
    live: true,
  },
  {
    id: "racer",
    title: "RACER",
    year: 1976,
    blurb:
      "Checkpoint racing down an endless curving highway — gas, brake, and traffic to slip past. Beat the clock, nothing else can stop you.",
    live: true,
  },
  {
    id: "tetris",
    title: "TETRIS",
    year: 1985,
    blurb: "Falling tetrominoes, rotation systems, line clears.",
    live: false,
  },
];
