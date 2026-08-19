// ============================================================================
// draw.mjs — the strokes every renderer kept re-spelling.
//
// Not a graphics library: a handful of verbs, extracted after the audit
// counted the beginPath/arc/fill dance thirty-five times across fourteen
// renderers. A renderer still owns its look — the colors, the radii, the
// composition — these own only the path boilerplate between a decision
// and its pixels.
// ============================================================================

// A filled circle.
export function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A stroked circle.
export function ring(ctx, x, y, r, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

// A filled rounded rectangle.
export function fillRound(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// The board vocabulary on top, fed by boardGeometry: the ring a cell
// wears (a selection, a check, the winning four) and the dots that mark
// legal moves — sized off the cell, with the same 2px stroke floor
// every board game hand-rolled at its own coefficient.
export function cellRing(ctx, geom, index, color, { radius = 0.42, width = 0.06 } = {}) {
  const { x, y } = geom.center(index);
  ring(ctx, x, y, geom.cell * radius, Math.max(2, geom.cell * width), color);
}

export function hintDots(ctx, geom, indices, color, radius = 0.12) {
  for (const index of indices) {
    const { x, y } = geom.center(index);
    disc(ctx, x, y, geom.cell * radius, color);
  }
}
