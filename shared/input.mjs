// Held-key tracking for games with continuous movement (Pong, Breakout).
// Snake keeps its own tap-queue input — discrete and continuous motion
// genuinely want different input models, so there's nothing to share there.

// Returns a live Set of the currently-held codes from the given list.
// preventDefault stops arrows from scrolling the page.
export function trackHeldKeys(...codes) {
  const held = new Set();
  document.addEventListener("keydown", (e) => {
    if (codes.includes(e.code)) {
      e.preventDefault();
      held.add(e.code);
    }
  });
  document.addEventListener("keyup", (e) => held.delete(e.code));
  return held;
}

// Collapse held keys into one analog axis value: -1, 0, or 1. Holding
// both directions cancels to 0 — that falls out of the arithmetic.
export function axis(held, negativeCodes, positiveCodes) {
  let dir = 0;
  if (negativeCodes.some((c) => held.has(c))) dir -= 1;
  if (positiveCodes.some((c) => held.has(c))) dir += 1;
  return dir;
}
