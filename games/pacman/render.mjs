// ============================================================================
// render.mjs — Pac-Maze's PROJECTION: state → pixels, and nothing else.
//
// Simple geometry only, palette only: walls are soft cyan blocks, pellets
// are dots, pac is one gold arc with a working jaw, and each ghost is the
// classic silhouette built from a dome, a rect, and three scalloped arcs
// cut out of the hem. No sprites, no assets — the 1980 look was geometry
// too. (The bonus fruit is omitted on purpose: this build keeps the maze,
// the pellets, and the ghosts — the parts that ARE the game.)
//
// Games don't "move" drawn pixels: each frame clears everything and
// redraws from state. State is the truth; the screen is just a projection.
// ============================================================================

import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha, blink } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { MAZE } from "./core/maze.mjs";

// Pixel size of one grid cell — the scale factor between the core's grid
// coordinates and the canvas. index.html sizes the court as cols×22 by
// rows×22 to match.
export const CELL = 22;

// Colors come from the CSS palette — the canvas and the page share a theme.
const WALL = cssVarAlpha("--cyan", 0.22);
const DOOR = cssVarAlpha("--text", 0.4);
const PELLET = cssVarAlpha("--text", 0.8);
const POWER = cssVar("--text");
const PAC = cssVar("--gold");
const FRIGHT = cssVar("--text");
const FRIGHT_FADE = cssVarAlpha("--text", 0.35);
const BG = cssVar("--bg"); // pupils, and the scallops cut from ghost hems
const GHOST_COLORS = {
  blinky: cssVar("--red"),
  pinky: cssVar("--purple"),
  inky: cssVar("--cyan"),
  clyde: cssVar("--orange"),
};

// Which way a mover faces, as an angle (right is 0, y grows downward).
const ANGLES = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

const cx = (x) => x * CELL + CELL / 2;
const cy = (y) => y * CELL + CELL / 2;

export function render(ctx, state, paused) {
  const court = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, court.width, court.height);

  drawWalls(ctx, state);
  drawPellets(ctx, state);
  drawPac(ctx, state);
  for (const ghost of state.ghosts) drawGhost(ctx, ghost, state);

  if (state.status === "ready") {
    drawOverlay(ctx, "READY", "press an arrow to play · WASD too");
  }
  if (paused) drawOverlay(ctx, "PAUSED", "P to resume");
  if (state.status === "gameover") drawOverlay(ctx, "GAME OVER", "Enter to restart");
}

// The maze never changes, so this draws straight from the strings — walls
// are board, not state. One rounded block per wall cell reads clean and
// merges visually where blocks touch.
function drawWalls(ctx, state) {
  ctx.fillStyle = WALL;
  MAZE.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== "#") continue;
      ctx.beginPath();
      ctx.roundRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4, 5);
      ctx.fill();
    }
  });
  // The ghost door: a thin bar — visibly not a wall, visibly not open.
  ctx.fillStyle = DOOR;
  ctx.fillRect(state.door.x * CELL + 2, cy(state.door.y) - 2, CELL - 4, 4);
}

function drawPellets(ctx, state) {
  ctx.fillStyle = PELLET;
  for (const k of state.pellets) {
    const [x, y] = k.split(",").map(Number);
    ctx.beginPath();
    ctx.arc(cx(x), cy(y), 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Power pellets pulse on the tick counter — frozen steady while ready,
  // since the tick only advances in play (blink is steady at zero anyway).
  if (!blink(state.tick, 30, 22)) return;
  ctx.fillStyle = POWER;
  for (const k of state.powers) {
    const [x, y] = k.split(",").map(Number);
    ctx.beginPath();
    ctx.arc(cx(x), cy(y), 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// One gold arc with a jaw that snaps on the tick clock, mouth toward the
// direction of travel.
function drawPac(ctx, state) {
  const pac = state.pac;
  const open = Math.floor(state.tick / 6) % 2 === 0;
  const jaw = open ? 0.55 : 0.08; // half-angle of the mouth, radians
  const angle = ANGLES[pac.dir];

  ctx.save();
  ctx.translate(cx(pac.x), cy(pac.y));
  ctx.rotate(angle);
  ctx.fillStyle = PAC;
  ctx.beginPath();
  ctx.arc(0, 0, CELL / 2 - 2, jaw, Math.PI * 2 - jaw);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The classic silhouette: dome (arc) + body (rect) + three small arcs of
// background cut from the hem. Frightened ghosts all wear the text color,
// flickering through cssVarAlpha as the window runs out; bare eyes are
// just the two circles hurrying home.
function drawGhost(ctx, ghost, state) {
  const x = cx(ghost.x);
  const y = cy(ghost.y);
  const r = CELL / 2 - 3;
  const facing = ANGLES[ghost.dir];

  if (!ghost.eyes) {
    const ending = state.frightTimer > 0 && state.frightTimer < 120;
    const frightColor = ending && !blink(state.frightTimer, 16, 10) ? FRIGHT_FADE : FRIGHT;
    ctx.fillStyle = ghost.frightened ? frightColor : GHOST_COLORS[ghost.name];

    ctx.beginPath();
    ctx.arc(x, y - 2, r, Math.PI, 0); // the dome
    ctx.rect(x - r, y - 2, r * 2, r + 4); // the body
    ctx.fill();
    ctx.fillStyle = BG; // the scallops: three arcs bitten out of the hem
    for (const dx of [-2 * (r / 3), 0, 2 * (r / 3)]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + r + 2, r / 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Eyes — the one part every regime keeps. They glance where the ghost
  // is headed; a frightened face gets dimmer, unsettled pupils only.
  const px = Math.cos(facing) * 1.5;
  const py = Math.sin(facing) * 1.5;
  for (const dx of [-3.5, 3.5]) {
    ctx.fillStyle = FRIGHT;
    ctx.beginPath();
    ctx.arc(x + dx, y - 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
    if (!ghost.frightened || ghost.eyes) {
      ctx.fillStyle = BG;
      ctx.beginPath();
      ctx.arc(x + dx + px, y - 3 + py, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
