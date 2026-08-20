// ============================================================================
// gestures.mjs — the court itself as a controller.
//
// Thumb buttons synthesize key events so no game grows a parallel input
// path (shared/touch.mjs); gestures play the same trick with the whole
// canvas. A swipe or a held zone becomes the keydown/keyup it means, and
// everything downstream — held-key tracking, tap queues, wake-on-ready,
// the replay recorder — works untouched, because to the game it WAS the
// keyboard. Attached for every pointer, not just coarse ones: a mouse
// drag steers Snake just as well, and costs nothing.
// ============================================================================

const press = (code) => {
  document.dispatchEvent(new KeyboardEvent("keydown", { code }));
  document.dispatchEvent(new KeyboardEvent("keyup", { code }));
};

// Swipes anywhere on the court become direction keys. The origin follows
// the finger after each fire, so one continuous drag steers through a
// whole corridor — Snake and Pac-Maze want a stream of turns, not one.
//   map — override any of left/right/up/down with another code
//         (Tetris maps up to Space: swipe up, hard drop)
//   tap — a code fired by a press that never traveled (Tetris rotates)
export function swipeKeys(canvas, { threshold = 24, tap = null, map = {} } = {}) {
  const codes = {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown",
    ...map,
  };
  canvas.style.touchAction = "none"; // steering must never scroll

  let id = null;
  let sx, sy, fired;

  canvas.addEventListener("pointerdown", (e) => {
    id = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    fired = false;
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
    press(
      codes[
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0 ? "right" : "left"
          : dy > 0 ? "down" : "up"
      ]
    );
    sx = e.clientX; // chain: the next swipe measures from here
    sy = e.clientY;
    fired = true;
  });

  const end = (e) => {
    if (e.pointerId !== id) return;
    if (!fired && tap && e.type === "pointerup") press(tap);
    id = null;
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
}

// Regions of the court as HELD keys — Breakout's paddle, Invaders'
// cannon. Multi-touch and refcounted: two fingers may hold two zones
// (move AND fire), two fingers in one zone release it only when the
// last one lifts. Zones and taps test court FRACTIONS (x, y in 0..1),
// so one declaration fits every screen.
//   zones — [{ when: (x, y) => bool, code }], first match holds
//   tap   — { code, when? }: fired by a quick press that stayed put
export function holdZones(canvas, { zones, tap = null }) {
  canvas.style.touchAction = "none";

  const holding = new Map(); // pointerId → { code, t0, moved }
  const counts = new Map(); // code → fingers holding it

  const at = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    return { x, y, zone: zones.find((z) => z.when(x, y))?.code ?? null };
  };
  const grab = (code) => {
    if (!code) return;
    counts.set(code, (counts.get(code) ?? 0) + 1);
    if (counts.get(code) === 1) {
      document.dispatchEvent(new KeyboardEvent("keydown", { code }));
    }
  };
  const drop = (code) => {
    if (!code) return;
    counts.set(code, counts.get(code) - 1);
    if (counts.get(code) === 0) {
      document.dispatchEvent(new KeyboardEvent("keyup", { code }));
    }
  };

  canvas.addEventListener("pointerdown", (e) => {
    const { x, y, zone } = at(e);
    holding.set(e.pointerId, { code: zone, t0: performance.now(), x, y });
    grab(zone);
  });

  canvas.addEventListener("pointermove", (e) => {
    const held = holding.get(e.pointerId);
    if (!held) return;
    const { zone } = at(e);
    if (zone !== held.code) {
      drop(held.code);
      held.code = zone;
      grab(zone);
    }
  });

  const end = (e) => {
    const held = holding.get(e.pointerId);
    if (!held) return;
    holding.delete(e.pointerId);
    drop(held.code);
    if (tap && e.type === "pointerup" && performance.now() - held.t0 < 180) {
      const { x, y } = at(e);
      if (!tap.when || tap.when(x, y)) press(tap.code);
    }
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
}
