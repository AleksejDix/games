// ============================================================================
// render.mjs — Memory's PROJECTION: state → pixels, and nothing else.
//
// Faces are SHAPES, not numbers — a card reads at a glance, which is the
// whole game. Shape and color derive from the value, so every pair is
// visually distinct. boardGeometry is exported for the shell's
// hit-testing: picking is projection geometry, and only the renderer
// knows where the cards are.
// ============================================================================

import { DECK } from "./logic.mjs";
import { drawOverlay } from "../../shared/overlay.mjs";
import { cssVar, cssVarAlpha, mono } from "../../shared/theme.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { boardGeometry as grid } from "../../shared/board.mjs";

const BG = cssVar("--bg");
const TEXT = cssVar("--text");
const MUTED = cssVarAlpha("--text", 0.3);
const COLORS = ["--accent", "--cyan", "--gold", "--red", "--purple"].map(cssVar);

export function boardGeometry(state, canvas) {
  const [cols, rows] = DECK.layout[state.pairs]; // the deck picks the shape
  return grid(canvas, cols, rows);
}

export function render(ctx, state, paused) {
  const { width, height } = courtSize(ctx.canvas);
  ctx.clearRect(0, 0, width, height);
  const { cols, cell, x0, y0 } = boardGeometry(state, ctx.canvas);
  const pad = cell * 0.06;

  state.cards.forEach((card, i) => {
    const x = x0 + (i % cols) * cell + pad;
    const y = y0 + Math.floor(i / cols) * cell + pad;
    const s = cell - pad * 2;

    ctx.globalAlpha = card.matched ? 0.4 : 1; // found pairs rest, dimmed
    ctx.fillStyle = BG;
    ctx.beginPath();
    ctx.roundRect(x, y, s, s, 10);
    ctx.fill();

    if (card.faceUp || card.matched) {
      drawShape(ctx, card.value, x + s / 2, y + s / 2, s * 0.28);
    } else {
      ctx.fillStyle = MUTED;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = mono(Math.round(s / 3), true);
      ctx.fillText("?", x + s / 2, y + s / 2 + 2);
    }
    ctx.globalAlpha = 1;
  });

  if (state.status === "solved") {
    if (state.players > 1) {
      const [a, b] = state.won;
      const title = a === b ? "A TIE" : `PLAYER ${a > b ? 1 : 2} WINS`;
      drawOverlay(ctx, title, `${a} : ${b} · Enter for a new deal`);
    } else {
      drawOverlay(ctx, "ALL PAIRS", `in ${state.moves} tries · Enter for a new deal`);
    }
  }
}

// Ten distinct faces from eight shapes × color bands — shape and color
// both derive from the value.
function drawShape(ctx, value, cx, cy, r) {
  const shape = (value - 1) % 8;
  ctx.fillStyle = ctx.strokeStyle = COLORS[(value - 1) % COLORS.length];
  ctx.lineWidth = r * 0.45;
  ctx.beginPath();
  switch (shape) {
    case 0: // circle
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 1: // square
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      break;
    case 2: // triangle
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.lineTo(cx - r, cy + r);
      ctx.fill();
      break;
    case 3: // diamond
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.fill();
      break;
    case 4: // ring
      ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 5: // plus
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();
      break;
    case 6: // cross
      ctx.moveTo(cx - r, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.moveTo(cx + r, cy - r);
      ctx.lineTo(cx - r, cy + r);
      ctx.stroke();
      break;
    case 7: // hourglass
      ctx.moveTo(cx - r, cy - r);
      ctx.lineTo(cx + r, cy - r);
      ctx.lineTo(cx - r, cy + r);
      ctx.lineTo(cx + r, cy + r);
      ctx.fill();
      break;
  }
}
