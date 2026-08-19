// ============================================================================
// render.mjs — Snake's PROJECTION: state → pixels, and nothing else.
//
// The shell layout now mirrors the core split: core/ holds the rules,
// render.mjs draws them, game.mjs only wires the two to the browser.
// Note what this module does NOT import: no logic.mjs — drawing Snake
// needs only the state object and its own visual constants.
//
// Games don't "move" drawn pixels: each frame clears everything and
// redraws from state. State is the truth; the screen is just a projection.
// ============================================================================

import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar } from "../../shared/theme.mjs";

// Pixel size of one grid cell — the scale factor between the core's grid
// coordinates and the canvas. game.mjs uses it to size the world.
export const CELL = 20;

// Colors come from the CSS palette — the canvas and the page share a theme.
const RED = cssVar("--red");
const GOLD = cssVar("--gold");

export function render(ctx, state, paused) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawCell(ctx, state.food.x, state.food.y, RED, 4);

  // The timed bonus: gold, and blinking during its last 10 ticks as an
  // expiry warning. ttl only changes per tick, so the blink runs at
  // simulation speed even though render runs every frame.
  if (state.bonus && (state.bonus.ttl > 10 || state.bonus.ttl % 2 === 0)) {
    drawCell(ctx, state.bonus.x, state.bonus.y, GOLD, 3);
  }

  // Snake: head brightest, body fading toward the tail.
  state.snake.forEach((seg, i) => {
    const t = i / state.snake.length; // 0 at head → 1 at tail
    const green = Math.round(231 - t * 120);
    drawCell(ctx, seg.x, seg.y, `rgb(80, ${green}, 80)`, 1);
  });

  if (paused) drawOverlay(ctx, "PAUSED", "Space to resume");
  if (state.status === "gameover") drawOverlay(ctx, "GAME OVER", "Enter to restart");
  if (state.status === "cleared") drawOverlay(ctx, "PERFECT GAME", "Enter to play again");
}

function drawCell(ctx, x, y, color, inset) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    x * CELL + inset,
    y * CELL + inset,
    CELL - inset * 2,
    CELL - inset * 2,
    4
  );
  ctx.fill();
}
