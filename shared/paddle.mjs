// ============================================================================
// paddle.mjs — the paddle-game mechanisms Pong and Breakout each carried,
// extracted once the second copy proved to differ from the first by
// nothing but orientation (and a third paddle game is the most likely
// next arrival on the shelf).
//
// Everything here is ONE-DIMENSIONAL and pure: there is a travel axis
// (toward the paddle's face) and a lateral axis (along it). Which of
// those is x and which is y — and what a catch or a miss costs — is the
// game's business, so the cores keep it. Mechanism here, rules there.
// ============================================================================

import { clamp } from "./math.mjs";

// The clamped analog slide. Input is a joystick-style value in [-1, 1]
// (keys push ±1, an AI may push gently); the clamp on `dir` means no
// input source can exceed the paddle's top speed, and the clamp on the
// result keeps the paddle's edges on the court.
export function slidePaddle(pos, dir, speed, dt, lo, hi) {
  return clamp(pos + clamp(dir, -1, 1) * speed * dt, lo, hi);
}

// Did the ball's leading edge cross the face THIS tick? `toward` is the
// sign of travel that approaches the face. One check does two jobs: it
// covers a fast ball tunneling several units in one step, and it refuses
// the physically impossible save — a ball already past the face before
// this tick's motion is a missed shot on its way out, and a paddle
// sliding into its row late must not teleport it back.
export function crossedFace(edge, prevEdge, face, toward) {
  return toward > 0
    ? edge >= face && prevEdge < face
    : edge <= face && prevEdge > face;
}

// Where on the paddle did the ball land? -1 = one edge, 0 = dead center,
// +1 = the other edge — this one number IS the paddle game's skill
// element. null = missed, sails past. (halfReach = the paddle's half
// extent plus the ball's half, so edge grazes still count.)
export function catchOffset(ballLateral, paddleCenter, halfReach) {
  const offset = (ballLateral - paddleCenter) / halfReach;
  return Math.abs(offset) > 1 ? null : offset;
}

// The rally accelerates: each catch scales the ball's speed, capped.
export function rallySpeed(vx, vy, speedUp, maxSpeed) {
  return Math.min(maxSpeed, Math.hypot(vx, vy) * speedUp);
}

// The paddle doesn't reflect the ball like a mirror. It RE-AIMS it: the
// outgoing angle depends only on where the paddle was struck, which is
// what lets a player aim shots. Returns the velocity split against the
// face — `out` along the paddle's normal (away from it), `across` along
// the paddle — for the core to map onto its own axes.
export function reaim(offset, speed, maxAngle) {
  const angle = offset * maxAngle;
  return { out: Math.cos(angle) * speed, across: Math.sin(angle) * speed };
}
