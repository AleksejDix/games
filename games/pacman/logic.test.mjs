// ============================================================================
// logic.test.mjs — run with:  node --test games/pacman/*.test.mjs
//
// The pattern in every test is Arrange / Act / Assert: build a state (often
// hand-placing pac or a ghost so the situation happens on the very next
// move), call step() one or more times, check what the rules promise.
//
// Two levers make a 60Hz world testable: `random` is injected (the one
// place chance enters is a frightened ghost's turn), and every mover
// carries a moveTimer in TICKS — set it to 1 and the next step() is that
// mover's cell hop, no waiting through ten ticks of nothing.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Pac from "./logic.mjs";
import { fakeRandom } from "../../shared/testing.mjs";

function makeState(opts = {}) {
  return Pac.createState({ random: fakeRandom(0.5), started: true, ...opts });
}

// Force the next step() to be one of pac's cell hops.
function hop(state) {
  state.pac.moveTimer = 1;
  return Pac.step(state);
}

// Force the next step() to be this ghost's cell hop.
function ghostHop(state, ghost) {
  ghost.moveTimer = 1;
  return Pac.step(state);
}

// ----------------------------------------------------------------------------
// The maze itself — the grammar the strings promise, validated as data.
// ----------------------------------------------------------------------------

test("maze: every row is its own mirror — left-right symmetric", () => {
  for (const row of Pac.MAZE) {
    assert.equal(row.length, Pac.COLS, "ragged row");
    assert.equal(row, [...row].reverse().join(""), `asymmetric: ${row}`);
  }
});

test("maze: exactly four power pellets, one per corner region", () => {
  const { powers } = Pac.parseMaze();
  assert.equal(powers.size, 4);
  for (const corner of ["1,1", "19,1", "1,21", "19,21"]) {
    assert.ok(powers.has(corner), `no power pellet at ${corner}`);
  }
});

test("maze: exactly one tunnel row, open at both edges", () => {
  const tunnels = Pac.MAZE.map((row, y) =>
    row[0] === " " && row[Pac.COLS - 1] === " " ? y : -1
  ).filter((y) => y >= 0);
  assert.deepEqual(tunnels, [Pac.parseMaze().tunnelRow]);
});

test("maze: one pac start, one door, a three-cell ghost house", () => {
  const { pacStart, door, house } = Pac.parseMaze();
  assert.ok(pacStart, "no P cell");
  assert.ok(door, "no - cell");
  assert.equal(house.length, 3);
  // The door sits on the house roof: every interior cell is right below it.
  for (const cell of house) assert.equal(cell.y, door.y + 1);
});

test("maze: every corridor is reachable from pac's start (flood fill)", () => {
  // The check that catches a walled-off pocket the eye would miss. The
  // fill walks pac-passable tiles (not '#', '-', 'G'), wrapping x for the
  // tunnel, and must paint every pellet, power, and bare corridor.
  const { pacStart } = Pac.parseMaze();
  const seen = new Set();
  const stack = [[pacStart.x, pacStart.y]];
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const k = Pac.key(x, y);
    if (seen.has(k)) continue;
    seen.add(k);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = (x + dx + Pac.COLS) % Pac.COLS;
      const ny = y + dy;
      if (Pac.passable(nx, ny)) stack.push([nx, ny]);
    }
  }
  Pac.MAZE.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      if (tile === "#" || tile === "-" || tile === "G") return;
      assert.ok(seen.has(Pac.key(x, y)), `unreachable corridor at ${x},${y} ('${tile}')`);
    });
  });
});

// ----------------------------------------------------------------------------
// The start rule, movement, and eating.
// ----------------------------------------------------------------------------

test("ready: the world holds still until the first direction wish", () => {
  const state = Pac.createState({ random: fakeRandom(0.5) });
  assert.equal(state.status, "ready");

  for (let i = 0; i < 30; i++) assert.deepEqual(Pac.step(state), []);
  assert.deepEqual({ x: state.pac.x, y: state.pac.y }, state.pacStart, "not an inch");
  assert.equal(state.tick, 0, "time itself waits");

  // The wish both wakes the world and steers it — and says so.
  const events = Pac.queueTurn(state, "left");
  assert.deepEqual(events, [{ type: "started" }]);
  assert.equal(state.status, "playing");
  assert.equal(state.pac.wish, "left");
});

test("pac eats a pellet: +10, and the event carries the remaining count", () => {
  const state = makeState();
  state.ghosts = []; // just pac and the board
  const total = state.pellets.size + state.powers.size;

  const events = hop(state); // one cell left, onto a pellet

  assert.deepEqual(events, [{ type: "ate", left: total - 1 }]);
  assert.equal(state.score, Pac.SCORE.pellet);
  assert.ok(!state.pellets.has(Pac.key(state.pac.x, state.pac.y)), "the cell is bare now");
});

test("a queued turn WAITS, and applies at the first cell where it is legal", () => {
  // Pac starts at (10,15) heading left; the first upward opening on that
  // corridor is column 7. The wish must survive three cells of wall.
  const state = makeState();
  state.ghosts = [];
  Pac.queueTurn(state, "up");

  hop(state); // (9,15) — up is walled, wish held
  hop(state); // (8,15)
  assert.equal(state.pac.wish, "up", "still queued");
  assert.equal(state.pac.dir, "left");
  hop(state); // (7,15) — the junction

  hop(state); // the wish finally applies here
  assert.deepEqual({ x: state.pac.x, y: state.pac.y }, { x: 7, y: 14 });
  assert.equal(state.pac.dir, "up");
  assert.equal(state.pac.wish, null, "the wish was consumed");
});

test("the tunnel wraps: off the left edge, in on the right", () => {
  const state = makeState();
  state.ghosts = [];
  const row = state.tunnelRow;
  Object.assign(state.pac, { x: 0, y: row, dir: "left" });

  hop(state);

  assert.deepEqual({ x: state.pac.x, y: state.pac.y }, { x: Pac.COLS - 1, y: row });
});

// ----------------------------------------------------------------------------
// Power pellets and the frightened window.
// ----------------------------------------------------------------------------

test("a power pellet scores 50, frightens the ghosts, and reverses them", () => {
  const state = makeState();
  Object.assign(state.pac, { x: 2, y: 1, dir: "left" }); // power at (1,1)
  const blinky = state.ghosts[0]; // outside, on the doorstep, facing left

  const events = hop(state);

  assert.deepEqual(events, [{ type: "power" }]);
  assert.equal(state.score, Pac.SCORE.power);
  assert.equal(state.frightTimer, Pac.frightTicks(1));
  assert.equal(blinky.frightened, true);
  assert.equal(blinky.dir, "right", "the panic reversal");
  assert.equal(state.ghosts[1].frightened, true, "housebound ghosts fear too");
  assert.equal(state.ghosts[1].dir, "left", "but only the free ones reverse");
});

test("frightened ghosts eaten in one window pay 200 then 400 — and turn to eyes", () => {
  const state = makeState();
  state.frightTimer = 300;
  const [blinky, pinky] = state.ghosts;
  Object.assign(blinky, { x: 9, y: 15, frightened: true });
  Object.assign(pinky, { x: 8, y: 15, frightened: true, inHouse: false });

  let events = hop(state); // pac steps onto blinky's cell
  let eaten = events.find((e) => e.type === "ghostEaten");
  assert.deepEqual(eaten, { type: "ghostEaten", value: 200, ghost: "blinky" });
  assert.equal(blinky.eyes, true, "what is left hurries home");
  assert.equal(blinky.frightened, false);

  events = hop(state); // and onto pinky's — same window, doubled
  eaten = events.find((e) => e.type === "ghostEaten");
  assert.deepEqual(eaten, { type: "ghostEaten", value: 400, ghost: "pinky" });
  assert.equal(state.frightChain, 2);
});

test("the frightened window closing calms every ghost and resets the ladder", () => {
  const state = makeState();
  const blinky = state.ghosts[0];
  blinky.frightened = true;
  state.frightTimer = 1;
  state.frightChain = 2;

  Pac.step(state);

  assert.equal(blinky.frightened, false);
  assert.equal(state.frightChain, 0, "the next window starts back at 200");
});

test("a frightened ghost turns at random — through the injected random", () => {
  const state = makeState();
  state.frightTimer = 300;
  const blinky = state.ghosts[0];
  // (1,4) offers up and right once the reverse (down) is excluded; a high
  // roll picks the later option. Same stream, same game — every run.
  Object.assign(blinky, { x: 1, y: 4, dir: "up", frightened: true });
  state.random = fakeRandom(0.99);

  ghostHop(state, blinky);

  assert.deepEqual({ x: blinky.x, y: blinky.y }, { x: 2, y: 4 });
  assert.equal(blinky.dir, "right");
});

test("eyes run home, slip through the door, and revive inside", () => {
  const state = makeState();
  const blinky = state.ghosts[0];
  Object.assign(blinky, { x: 9, y: 8, dir: "right", eyes: true });

  ghostHop(state, blinky); // greedy toward the doorstep
  assert.deepEqual({ x: blinky.x, y: blinky.y }, { x: 10, y: 8 });

  ghostHop(state, blinky); // the entry script: down through the door...
  assert.deepEqual({ x: blinky.x, y: blinky.y }, { x: 10, y: 9 });
  ghostHop(state, blinky); // ...onto the house floor, and revive
  assert.deepEqual({ x: blinky.x, y: blinky.y }, { x: 10, y: 10 });
  assert.equal(blinky.eyes, false);
  assert.equal(blinky.inHouse, true);
  assert.equal(blinky.releaseTick, state.tick, "released immediately");

  ghostHop(state, blinky); // the exit script takes over
  ghostHop(state, blinky);
  assert.deepEqual({ x: blinky.x, y: blinky.y }, { x: 10, y: 8 }, "back on the doorstep");
  assert.equal(blinky.inHouse, false);
});

// ----------------------------------------------------------------------------
// The mode clock and the four personalities.
// ----------------------------------------------------------------------------

test("the mode clock flips scatter→chase at the boundary — and forces a reversal", () => {
  const state = makeState();
  state.modeTimer = 1;
  const [blinky, pinky] = state.ghosts;

  Pac.step(state);

  assert.equal(state.mode, "chase");
  assert.equal(state.modeTimer, Pac.MODES.chase);
  assert.equal(blinky.dir, "right", "the tell: free ghosts turn on their heels");
  assert.equal(pinky.dir, "left", "housebound ghosts have nothing to reverse");
});

test("chase targets: Blinky aims at pac's very cell", () => {
  const state = makeState();
  state.mode = "chase";

  const target = Pac.targetFor(state.ghosts[0], state);

  assert.deepEqual(target, { x: state.pac.x, y: state.pac.y });
});

test("chase targets: Pinky aims four cells ahead of pac's facing", () => {
  const state = makeState();
  state.mode = "chase";
  Object.assign(state.pac, { x: 10, y: 15, dir: "left" });

  const target = Pac.targetFor(state.ghosts[1], state);

  assert.deepEqual(target, { x: 6, y: 15 });
});

test("chase targets: Inky doubles the vector from Blinky to 2-ahead-of-pac", () => {
  const state = makeState();
  state.mode = "chase";
  Object.assign(state.pac, { x: 10, y: 15, dir: "left" });
  Object.assign(state.ghosts[0], { x: 10, y: 8 }); // Blinky, the pivot

  const target = Pac.targetFor(state.ghosts[2], state);

  // Two ahead of pac is (8,15); doubled from (10,8): (2·8−10, 2·15−8).
  assert.deepEqual(target, { x: 6, y: 22 });
});

test("chase targets: Clyde chases when far, slinks to his corner up close", () => {
  const state = makeState();
  state.mode = "chase";
  const clyde = state.ghosts[3];

  Object.assign(clyde, { x: 1, y: 1 }); // far across the maze
  assert.deepEqual(Pac.targetFor(clyde, state), { x: state.pac.x, y: state.pac.y });

  Object.assign(clyde, { x: state.pac.x + 1, y: state.pac.y }); // breathing distance
  assert.deepEqual(Pac.targetFor(clyde, state), { x: 1, y: Pac.ROWS - 2 });
});

test("scatter targets are the four corners", () => {
  const state = makeState(); // mode starts as scatter
  const corners = state.ghosts.map((g) => Pac.targetFor(g, state));

  assert.deepEqual(corners, [
    { x: Pac.COLS - 2, y: 1 }, // blinky, top right
    { x: 1, y: 1 }, // pinky, top left
    { x: Pac.COLS - 2, y: Pac.ROWS - 2 }, // inky, bottom right
    { x: 1, y: Pac.ROWS - 2 }, // clyde, bottom left
  ]);
});

// ----------------------------------------------------------------------------
// Getting caught, the death freeze, and running out of lives.
// ----------------------------------------------------------------------------

test("touching a ghost costs a life, freezes the world, then resets the marks", () => {
  const state = makeState();
  const blinky = state.ghosts[0];
  Object.assign(blinky, { x: 9, y: 15 }); // parked in pac's path

  const events = hop(state);

  assert.ok(events.some((e) => e.type === "caught"));
  assert.equal(state.status, "caught");
  assert.equal(state.lives, Pac.LIVES - 1);
  assert.equal(state.caughtTimer, Pac.CAUGHT.freeze);
  assert.ok(!state.pellets.has("9,15"), "the meal still counted");

  // The freeze: nothing happens, tick for tick, until the timer runs out.
  for (let i = 0; i < Pac.CAUGHT.freeze; i++) assert.deepEqual(Pac.step(state), []);

  assert.equal(state.status, "playing");
  assert.deepEqual({ x: state.pac.x, y: state.pac.y }, state.pacStart);
  // The reset deals a fresh roster — read it anew, don't trust old refs.
  const respawned = state.ghosts[0];
  assert.deepEqual(
    { x: respawned.x, y: respawned.y },
    { x: state.door.x, y: state.door.y - 1 }
  );
  assert.equal(state.ghosts[1].inHouse, true, "the stagger starts over");
  assert.ok(!state.pellets.has("9,15"), "a lost life refills nothing");
});

test("the last life skips the freeze — straight to gameover", () => {
  const state = makeState();
  state.lives = 1;
  Object.assign(state.ghosts[0], { x: 9, y: 15 });

  const events = hop(state);

  assert.ok(events.some((e) => e.type === "died"));
  assert.equal(state.status, "gameover");
});

// ----------------------------------------------------------------------------
// Clearing the board, terminal inertness, and the machine.
// ----------------------------------------------------------------------------

test("eating the last pellet clears the level: event, refill, harder lap", () => {
  const state = makeState();
  state.ghosts = [];
  state.pellets = new Set(["9,15"]); // one crumb left, in pac's path
  state.powers = new Set();

  const events = hop(state);

  assert.deepEqual(events, [
    { type: "ate", left: 0 },
    { type: "cleared", level: 1 },
  ]);
  assert.equal(state.level, 2);
  const fresh = Pac.parseMaze();
  assert.equal(state.pellets.size, fresh.pellets.size, "the board refills");
  assert.equal(state.powers.size, 4);
  assert.deepEqual({ x: state.pac.x, y: state.pac.y }, state.pacStart);
  assert.ok(Pac.frightTicks(2) < Pac.frightTicks(1), "frightened windows shrink");
  assert.ok(Pac.scatterTicks(2) < Pac.scatterTicks(1), "scatter shrinks too");
});

test("after game over, step() does nothing at all", () => {
  const state = makeState();
  state.status = "gameover";
  const before = structuredClone({ ...state, random: null });

  assert.deepEqual(Pac.step(state), []);
  assert.deepEqual(structuredClone({ ...state, random: null }), before);
});

test("the status machine: the graph is closed, and terminal means terminal", () => {
  for (const [from, exits] of Object.entries(Pac.TRANSITIONS)) {
    for (const to of exits) {
      assert.ok(to in Pac.TRANSITIONS, `${from} → ${to} names an unknown status`);
    }
  }

  const state = makeState();
  Pac.transition(state, "caught");
  Pac.transition(state, "playing"); // the freeze always releases

  Pac.transition(state, "gameover");
  assert.throws(() => Pac.transition(state, "playing"), /illegal status change/);
});
