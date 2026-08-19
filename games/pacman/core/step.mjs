// The heart of the game: advancing the simulation by one tick.
//
// One tick is 1/60s of world time. Nothing moves smoothly — pac hops a
// whole cell every pacInterval ticks, ghosts every ghostInterval, and the
// different intervals are the whole speed system (see constants.mjs).
// step() returns EVENTS AS DATA: an array of { type, ...payload } objects
// listing everything that happened, in order. The shell reacts — waka,
// sirens, high scores — without knowing a single rule.

import {
  DIRS,
  OPPOSITE,
  SPEED,
  SCORE,
  CAUGHT,
  MODES,
  pacInterval,
  ghostInterval,
  frightTicks,
  scatterTicks,
} from "./constants.mjs";
import { COLS, key, passable, parseMaze } from "./maze.mjs";
import { moveGhost } from "./ghosts.mjs";
import { resetPositions } from "./state.mjs";
import { transition } from "./machine.mjs";

// Buffer a direction wish — Snake's queued turn, with the classic twist
// that the wish WAITS: pac keeps it until the next cell where the turn is
// legal, which is the cornering feel (simplified from pixel level). The
// first wish also wakes a ready world, and says so.
export function queueTurn(state, dir) {
  if (state.status === "ready") {
    transition(state, "playing");
    state.pac.wish = dir;
    return [{ type: "started" }];
  }
  if (state.status === "playing") state.pac.wish = dir;
  // In caught/gameover the wish would be stale by the reset — dropped.
}

// Advance the simulation by exactly one tick.
export function step(state) {
  // The death freeze: the whole world stands still for a beat after a
  // catch, then everyone returns to their marks and play resumes.
  if (state.status === "caught") {
    state.caughtTimer -= 1;
    if (state.caughtTimer <= 0) {
      resetPositions(state);
      transition(state, "playing");
    }
    return [];
  }

  if (state.status !== "playing") return [];

  const events = [];
  state.tick += 1;

  // --- the clocks -----------------------------------------------------------
  // Frightened mode PAUSES the scatter/chase alternation (as the original
  // did): only one of the two clocks runs on any tick.
  if (state.frightTimer > 0) {
    state.frightTimer -= 1;
    if (state.frightTimer === 0) {
      for (const ghost of state.ghosts) ghost.frightened = false;
      state.frightChain = 0; // the 200-400-800-1600 ladder resets with the window
    }
  } else {
    state.modeTimer -= 1;
    if (state.modeTimer <= 0) {
      state.mode = state.mode === "scatter" ? "chase" : "scatter";
      state.modeTimer =
        state.mode === "scatter" ? scatterTicks(state.level) : MODES.chase;
      // A mode change is the ONE thing that forces a reversal — the
      // ghosts' tell, and the player's only warning.
      for (const ghost of state.ghosts) {
        if (!ghost.inHouse && !ghost.eyes) ghost.dir = OPPOSITE[ghost.dir];
      }
    }
  }

  // --- pac ------------------------------------------------------------------
  state.pac.moveTimer -= 1;
  if (state.pac.moveTimer <= 0) {
    state.pac.moveTimer = pacInterval(state.level);
    movePac(state, events);
    if (state.status !== "playing") return events; // ate the fatal cell
    if (handleContacts(state, events)) return events;
  }

  // --- the ghosts -----------------------------------------------------------
  for (const ghost of state.ghosts) {
    ghost.moveTimer -= 1;
    if (ghost.moveTimer <= 0) {
      ghost.moveTimer = ghost.eyes
        ? SPEED.eyes
        : ghost.frightened
          ? SPEED.frightened
          : ghostInterval(state.level);
      moveGhost(ghost, state);
      if (handleContacts(state, events)) return events;
    }
  }

  return events;
}

// One cell of pac: turn if the wish is legal here, walk if the way is
// open (pac parks against walls — the original stops, it doesn't bounce),
// then eat whatever the new cell holds.
function movePac(state, events) {
  const pac = state.pac;

  if (pac.wish && pac.wish !== pac.dir) {
    const w = DIRS[pac.wish];
    if (passable(pac.x + w.x, pac.y + w.y)) {
      pac.dir = pac.wish;
      pac.wish = null;
    }
  }

  const d = DIRS[pac.dir];
  if (!passable(pac.x + d.x, pac.y + d.y)) return; // parked, still chomping
  pac.x = (pac.x + d.x + COLS) % COLS; // the tunnel: off one side, in the other
  pac.y = pac.y + d.y;

  const here = key(pac.x, pac.y);

  if (state.pellets.has(here)) {
    state.pellets.delete(here);
    state.score += SCORE.pellet;
    // `left` counts every remaining eatable — the shell's waka alternates
    // on its parity, and the renderer never has to count.
    events.push({ type: "ate", left: state.pellets.size + state.powers.size });
  }

  if (state.powers.has(here)) {
    state.powers.delete(here);
    state.score += SCORE.power;
    state.frightTimer = frightTicks(state.level);
    state.frightChain = 0;
    for (const ghost of state.ghosts) {
      if (ghost.eyes) continue; // eyes have nothing left to frighten
      ghost.frightened = true;
      // The panic reversal — frightened ghosts turn tail on the spot.
      if (!ghost.inHouse) ghost.dir = OPPOSITE[ghost.dir];
    }
    events.push({ type: "power" });
  }

  if (state.pellets.size === 0 && state.powers.size === 0) {
    // Level cleared: report it, refill the board, and start the next lap
    // harder — shorter frightened windows, shorter scatter, quicker feet.
    events.push({ type: "cleared", level: state.level });
    state.level += 1;
    const maze = parseMaze();
    state.pellets = maze.pellets;
    state.powers = maze.powers;
    resetPositions(state);
  }
}

// Same-cell contact between pac and each ghost. Cell-granular movement
// keeps the original's famous pass-through: actors that SWAP cells in one
// tick cross without touching, exactly as the arcade sometimes allowed.
// Returns true when the tick must end (a life was lost).
function handleContacts(state, events) {
  const pac = state.pac;
  for (const ghost of state.ghosts) {
    if (ghost.x !== pac.x || ghost.y !== pac.y || ghost.eyes) continue;

    if (ghost.frightened) {
      // The doubling ladder: 200, 400, 800, 1600 within one window.
      const value = SCORE.ghost * 2 ** state.frightChain;
      state.frightChain += 1;
      state.score += value;
      ghost.frightened = false;
      ghost.eyes = true; // sprint home, revive, return
      events.push({ type: "ghostEaten", value, ghost: ghost.name });
      continue;
    }

    state.lives -= 1;
    if (state.lives <= 0) {
      transition(state, "gameover");
      events.push({ type: "died" });
    } else {
      transition(state, "caught");
      state.caughtTimer = CAUGHT.freeze;
      events.push({ type: "caught" });
    }
    return true;
  }
  return false;
}
