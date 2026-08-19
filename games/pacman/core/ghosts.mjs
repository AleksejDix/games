// ============================================================================
// ghosts.mjs — the famous part: four personalities from one mechanism.
//
// Every ghost runs the SAME movement rule: at each cell, look at the legal
// exits (never the reverse of where you came from), and take the one that
// minimizes straight-line distance to your TARGET tile. No pathfinding, no
// search — the 1980 trick is that greedy plus no-reversing plus a dead-end-
// free maze behaves like pursuit. All the personality lives in WHERE each
// ghost aims:
//
//   Blinky  chases pac's cell — the pure pursuer.
//   Pinky   aims 4 cells ahead of pac's facing — the ambusher.
//   Inky    doubles the vector from Blinky to 2-ahead-of-pac — the wildcard
//           whose target only makes sense as a pincer with Blinky.
//   Clyde   chases like Blinky when far (> 8 cells), but loses his nerve
//           up close and slinks to his corner — the feint.
//
// (We skip the original's up-direction overflow bug in Pinky and Inky's
// targeting — a famous accident, not a design.)
//
// In scatter mode all four aim at their home corners; frightened ghosts
// ignore targets entirely and turn at random — the ONE place chance enters
// the game, through state.random. Eaten ghosts become eyes that target the
// house doorstep at sprint speed, then file back in through the door.
// ============================================================================

import { DIRS, OPPOSITE, CLYDE_RANGE } from "./constants.mjs";
import { COLS, ROWS, passable } from "./maze.mjs";
import { pick } from "../../../shared/random.mjs";

// The classic tie-break order: when two exits are equally close to the
// target, up beats left beats down beats right.
const DIR_ORDER = ["up", "left", "down", "right"];

// Compass corner → an actual tile of this maze. Aiming at a wall-adjacent
// tile is fine: greedy distance never needs the target to be reachable.
const CORNERS = {
  topLeft: { x: 1, y: 1 },
  topRight: { x: COLS - 2, y: 1 },
  bottomLeft: { x: 1, y: ROWS - 2 },
  bottomRight: { x: COLS - 2, y: ROWS - 2 },
};

const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

// Where is this ghost trying to go RIGHT NOW? Exported for the tests —
// the personalities are the spec, so they get asserted directly.
export function targetFor(ghost, state) {
  if (ghost.eyes) return { x: state.door.x, y: state.door.y - 1 }; // the doorstep
  if (state.mode === "scatter") return CORNERS[ghost.corner];

  const pac = state.pac;
  const facing = DIRS[state.pac.dir];
  switch (ghost.name) {
    case "blinky":
      return { x: pac.x, y: pac.y };
    case "pinky":
      return { x: pac.x + 4 * facing.x, y: pac.y + 4 * facing.y };
    case "inky": {
      // Double the vector from Blinky to the tile 2 ahead of pac: 2T - B.
      const blinky = state.ghosts.find((g) => g.name === "blinky");
      const t = { x: pac.x + 2 * facing.x, y: pac.y + 2 * facing.y };
      return { x: 2 * t.x - blinky.x, y: 2 * t.y - blinky.y };
    }
    case "clyde":
      return dist2(ghost, pac) > CLYDE_RANGE ** 2
        ? { x: pac.x, y: pac.y }
        : CORNERS[ghost.corner];
    default:
      return CORNERS[ghost.corner];
  }
}

// One cell's decision. Reversing is off the menu — except when it is the
// ONLY exit, which this maze never offers a living ghost but an eyes-run
// can momentarily create at the doorstep.
export function chooseDirection(ghost, state) {
  const options = DIR_ORDER.filter((name) => {
    if (name === OPPOSITE[ghost.dir]) return false;
    const d = DIRS[name];
    return passable(ghost.x + d.x, ghost.y + d.y, { eyes: ghost.eyes });
  });
  if (options.length === 0) return OPPOSITE[ghost.dir];
  if (options.length === 1) return options[0];

  if (ghost.frightened && !ghost.eyes) return pick(options, state.random);

  const target = targetFor(ghost, state);
  let best = options[0];
  let bestD = Infinity;
  for (const name of options) {
    const d = DIRS[name];
    const cell = { x: ghost.x + d.x, y: ghost.y + d.y };
    const dd = dist2(cell, target);
    if (dd < bestD) {
      bestD = dd;
      best = name;
    }
  }
  return best;
}

// Advance one ghost by one CELL (its speed timer, in step.mjs, decides how
// often this is called). Three regimes: waiting/leaving the house, an
// eyes-run arriving home, and ordinary corridor movement.
export function moveGhost(ghost, state) {
  const door = state.door;

  if (ghost.inHouse) {
    // Hold until released, then the exit script: sidle under the door,
    // rise through it, and take the doorstep facing left — no AI inside
    // the house, which is how the door stays one-way for the living.
    if (state.tick < ghost.releaseTick) return;
    if (ghost.x !== door.x) {
      ghost.x += Math.sign(door.x - ghost.x);
      ghost.dir = door.x > ghost.x ? "right" : "left";
    } else {
      ghost.y -= 1;
      ghost.dir = "up";
      if (ghost.y === door.y - 1) {
        ghost.inHouse = false;
        ghost.dir = "left";
      }
    }
    return;
  }

  if (ghost.eyes && ghost.x === door.x && ghost.y >= door.y - 1 && ghost.y <= door.y) {
    // Home: the doorstep reached, the entry script mirrors the exit —
    // straight down through the door, and revive on the house floor,
    // released immediately (the original's eyes turn around fast too).
    ghost.y += 1;
    ghost.dir = "down";
    if (ghost.y === door.y + 1) {
      ghost.eyes = false;
      ghost.frightened = false;
      ghost.inHouse = true;
      ghost.releaseTick = state.tick;
    }
    return;
  }

  ghost.dir = chooseDirection(ghost, state);
  const d = DIRS[ghost.dir];
  ghost.x = (ghost.x + d.x + COLS) % COLS; // the tunnel wraps ghosts too
  ghost.y = ghost.y + d.y;
}
