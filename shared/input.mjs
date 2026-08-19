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

// A pointer event's position in CANVAS coordinates. The canvas may be
// CSS-scaled (max-width on small screens), so client pixels must be
// mapped through the bounding rect onto the internal resolution.
export function pointerPosition(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * canvas.width) / rect.width,
    y: ((e.clientY - rect.top) * canvas.height) / rect.height,
  };
}

// A live pointer position over the canvas — the mouse counterpart of
// trackHeldKeys. Returns a POSITION that updates itself; clicks are
// actions, so games wire those to their own handlers.
export function trackPointer(canvas) {
  const pos = { x: canvas.width / 2, y: canvas.height / 2 };
  canvas.addEventListener("pointermove", (e) => {
    Object.assign(pos, pointerPosition(canvas, e));
  });
  return pos;
}
