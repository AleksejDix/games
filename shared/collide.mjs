// Collision mechanisms — pure math, so cores may import them. Extracted
// once the same two tests had been written by hand across five cores.

// Axis-aligned rectangles ({x, y, w, h}) overlapping — Breakout's bricks,
// Invaders' shots and bunkers.
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Two points ({x, y}) within a radius — squared on both sides, so no
// square root is ever paid. Asteroids' rocks, Missile Command's blasts.
export function withinRadius(a, b, r) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= r * r;
}
