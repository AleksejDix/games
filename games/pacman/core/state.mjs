// The shape of the world. One plain object holds everything the rules need —
// no classes, no hidden fields, trivially inspectable and serializable.
//
// Randomness is INJECTED: createState accepts a `random` function. The one
// place chance enters this game is a frightened ghost picking a turn, so a
// test that fakes `random` replays a whole game move for move.

import { COLS, ROWS, parseMaze } from "./maze.mjs";
import { GHOSTS, LIVES, SPEED, scatterTicks } from "./constants.mjs";

export function createState({
  random = Math.random,
  level = 1, // later levels shrink frightened mode and scatter, and hurry feet
  started = false, // true skips ready — thumbnails and tests
} = {}) {
  const maze = parseMaze();
  const state = {
    cols: COLS,
    rows: ROWS,
    random,
    level,
    score: 0,
    lives: LIVES,
    status: started ? "playing" : "ready",
    tick: 0,

    // The consumables — eaten out of these Sets; refilled on a clear.
    pellets: maze.pellets,
    powers: maze.powers,

    // Landmarks the rules keep needing (the strings stay in maze.mjs).
    door: maze.door,
    house: maze.house,
    pacStart: maze.pacStart,
    tunnelRow: maze.tunnelRow,

    pac: null, // filled by resetPositions below
    ghosts: null,

    // The global ghost mode: all four scatter and chase together, on one
    // clock. Frightened mode PAUSES this clock (the original did too).
    mode: "scatter",
    modeTimer: scatterTicks(level),
    frightTimer: 0,
    frightChain: 0, // ghosts eaten in the current frightened window

    caughtTimer: 0, // ticks left in the death freeze
  };
  resetPositions(state);
  return state;
}

// Everyone back to their marks — a fresh life, a fresh level. The pellets
// are NOT touched: a lost life resumes the same half-eaten board.
export function resetPositions(state) {
  state.pac = {
    ...state.pacStart,
    dir: "left", // the original's opening move
    wish: null, // the queued turn, applied at the next legal cell
    moveTimer: SPEED.pac,
    // Cosmetic, for the renderer's glide: the previous cell and the
    // leg's length in ticks. A fresh mark starts already "arrived".
    from: { ...state.pacStart },
    stepTicks: SPEED.pac,
  };
  // Blinky starts outside, on the doorstep; the other three wait inside
  // and file out on their fixed delays, counted from NOW — so a respawn
  // staggers them again just like the level start.
  const inside = [state.house[1], state.house[0], state.house[2]]; // center first
  state.ghosts = GHOSTS.map((g, i) => {
    const mark = i === 0 ? { x: state.door.x, y: state.door.y - 1 } : inside[i - 1];
    return {
      name: g.name,
      corner: g.corner,
      ...mark,
      dir: "left",
      inHouse: i !== 0,
      releaseTick: state.tick + g.delay,
      frightened: false,
      eyes: false,
      moveTimer: SPEED.ghost,
      // Cosmetic, for the renderer's glide: a fresh mark starts "arrived".
      from: { ...mark },
      stepTicks: SPEED.ghost,
    };
  });
  state.mode = "scatter";
  state.modeTimer = scatterTicks(state.level);
  state.frightTimer = 0;
  state.frightChain = 0;
}
