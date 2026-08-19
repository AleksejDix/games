# NEON GAMES

Classics, rebuilt from scratch to learn game development. Twenty-eight games spanning nine centuries (1100 to 2014), each one a small, honest reconstruction of the original's rules, all living inside one shared catalog shell.

No game framework. No runtime dependencies. Vanilla ES modules, canvas, and a dev server.

**Play:** `npm install && npm run dev`, then open http://localhost:5190

## The shelf

| Year | Game | The idea it teaches |
|---|---|---|
| 1100 | Checkers | Forced captures: the legal-move list IS the difficulty |
| 1475 | Chess | Movegen you can trust: perft counts prove every rule |
| 1697 | Peg Solitaire | One verb (jump), legal moves as data |
| 1880 | Fifteen | Shuffle by legal random walk: solvable by construction |
| 1883 | Reversi | Rays that flip; mobility, not material, wins the middle |
| 1913 | Memory | Hidden state; the real game plays in your head |
| 1952 | OXO | Perfect minimax, proven unbeatable by exhaustive test |
| 1972 | Pong | Continuous motion, angle-of-incidence bounces, an AI as a pure function |
| 1974 | Connect Four | Gravity does the aiming; alpha-beta sees seven plies |
| 1976 | Snake | Grid movement, input buffering, rejection sampling done safely |
| 1976 | Breakout | AABB collision, lives, a win condition |
| 1976 | Racer | A streaming world that invents itself past the horizon |
| 1976 | Whac-a-Mole | Chance per tick; a timer as the only enemy |
| 1978 | Space Invaders | A fleet in lockstep that accelerates as it thins |
| 1978 | Simon | Sound is not the feedback. Sound is the game |
| 1979 | Asteroids | Rotation, thrust, and inertia on a wrapping torus |
| 1979 | Lunar Lander | Gravity against a fuel budget; the first game won by stopping |
| 1980 | Missile Command | The first pointer game; six cities, never rebuilt |
| 1980 | Pac-Maze | Four ghosts, one targeting rule: personality as data |
| 1981 | Frogger | Two worlds in one crossing, and the first moving platforms |
| 1982 | Sokoban | Undo as a first-class verb; deadly corners called on the spot |
| 1985 | Tetris | Seven-bag dealing, wall kicks, gravity that hurries |
| 1989 | Minesweeper | Honest numbers, a safe first dig, flood fill without recursion |
| 1995 | Lights Out | Secretly linear algebra: press order never matters |
| 1998 | Cave Copter | The held button, a force rather than an impulse |
| 2013 | Flappy | One button, merciless gravity |
| 2014 | 2048 | Slide, merge once per move, spawn only after real motion |
| 2014 | Chrome Dino | Physics and sprites lifted from Chromium's own source |

## Architecture

Every game ships the same three-layer shape, and the shape is enforced by tests, not by discipline:

```
games/<id>/
  core/            the RULES: pure, deterministic, no DOM, no clock
    constants.mjs
    state.mjs      createState(options) with injectable random
    machine.mjs    the status graph as plain data
    step.mjs       step(state, input) -> an array of typed events
  logic.mjs        the core, re-exported as one surface
  logic.test.mjs   the rules, tested headlessly with node --test
  render.mjs       the PROJECTION: render(ctx, state, paused), draws and nothing else
  game.mjs         the WIRING: declares its parts to the shared engine
  index.html       the page, framed by the <game-shell> web component
  style.css
```

The house line, repeated until it stuck: **mechanism here, rules there**. Shared code (`shared/`) holds only mechanisms that earned extraction by appearing three times: the fixed-timestep loop, the state-machine guard, the session lifecycle, collision math, seeded shuffling, the streaming-world helpers, a synthesizer for sound. What a mechanism produces (what an obstacle is, what touching one costs) stays in each game's core.

Three ideas carry most of the weight:

- **Cores are pure.** No DOM, no timers, no `Math.random`. Randomness is injected, so every test controls chance completely and every run is reproducible. `architecture.test.mjs` greps the source and fails the build on the first `document` in a core.
- **Events out, sounds and pixels in the shell.** `step()` returns typed events (`ate`, `paddle`, `died`). The shell decides what they look and sound like. Also, `node --test` has no speakers.
- **One contract, tested against every game.** `conformance.test.mjs` runs the same suite over every live core in the manifest: the interface exists, the starting status is known to the machine, terminal states are truly inert, the transition graph is closed.

## The catalog shell

The shell at `/` is its own small app, held to the same rules as the games:

- `games.mjs` is the single registration point. One entry drives the catalog card, the production build's inputs, and the conformance harness.
- A 71-line history router where a route pairs a matcher with a view. Filters are a native GET form, so filter state lives in the URL and nowhere else: shareable, bookmarkable, back-button-proof.
- Thumbnails are not screenshots. The catalog imports each game's real core, steps its real rules, and draws with its real renderer into an offscreen canvas. The card cannot lie about the game.
- Games play in an iframe navigated with `location.replace()`, so the invisible iframe navigation never pollutes the browser's back button.

## Running it

```sh
npm install
npm run dev        # http://localhost:5190 (strictPort: fails loudly, never hops)
npm test           # all suites, no browser needed
npm run build      # static multi-page build to dist/
```

## Adding a game

1. Create `games/<id>/` with the shape above.
2. Add one entry to `GAMES` in `games.mjs`.

That is the whole registration. The architecture suite will hold you to the shape, the conformance suite will hold your core to the contract, and `node --test` auto-discovers your tests.
