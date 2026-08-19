import { courtSize } from "./resolution.mjs";

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
  const court = courtSize(canvas); // COURT units, whatever the backing
  return {
    x: ((e.clientX - rect.left) * court.width) / rect.width,
    y: ((e.clientY - rect.top) * court.height) / rect.height,
  };
}

// A live pointer position over the canvas — the mouse counterpart of
// trackHeldKeys. Returns a POSITION that updates itself; clicks are
// actions, so games wire those to their own handlers.
export function trackPointer(canvas) {
  const court = courtSize(canvas);
  const pos = { x: court.width / 2, y: court.height / 2 };
  canvas.addEventListener("pointermove", (e) => {
    Object.assign(pos, pointerPosition(canvas, e));
  });
  return pos;
}

// The key→action table four shells each hand-rolled, as one mechanism:
// look the code up, preventDefault (a known key never scrolls the page,
// playing or not), wake a ready world if asked, dispatch what the
// action returns. Wire the result straight into the engine's special
// hook — the engine already withholds it while paused.
//   map      — { code: (state) => events | nothing }
//   noRepeat — codes that fire once per press (spins, slams)
//   wake     — (state) => events, dispatched first while status is "ready"
//   when     — (state) => bool: the table only applies while true. A
//              false LETS THE KEY FALL THROUGH — Breakout's contextual
//              Space launches while serving and pauses otherwise,
//              because the refusal reaches the engine's pause check.
export function actionKeys(map, { noRepeat = [], wake = null, when = null } = {}) {
  const oncePer = new Set(noRepeat);
  return (e, api) => {
    const act = map[e.code];
    if (!act) return false;
    if (when && !when(api.state)) return false;
    e.preventDefault();
    if (e.repeat && oncePer.has(e.code)) return true;
    if (wake && api.state.status === "ready") api.dispatch(wake(api.state));
    const events = act(api.state);
    if (events) api.dispatch(events); // some actions (Snake's queue) speak for themselves
    return true;
  };
}

// A pointer event mapped onto a grid of cells — the picking five board
// games each wrote by hand. Returns the cell index, or -1 off the board.
export function pickCell(canvas, e, { cols, rows, cell, x0 = 0, y0 = 0 }) {
  const p = pointerPosition(canvas, e);
  const col = Math.floor((p.x - x0) / cell);
  const row = Math.floor((p.y - y0) / cell);
  return col < 0 || col >= cols || row < 0 || row >= rows ? -1 : row * cols + col;
}
