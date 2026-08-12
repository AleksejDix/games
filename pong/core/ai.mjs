// The computer opponent.
//
// Key insight: the AI is NOT special. step() takes -1|0|1 per paddle and
// doesn't care whether a human's keys or this function produced it. The AI
// is just another input source — a pure function of the state. That makes
// it trivially testable, and swapping it for a second human (or a smarter
// AI) touches nothing in the core.
//
// This one only reacts to the ball's CURRENT row — no prediction of where
// the ball will land. Combined with the paddle speed limit, that's what
// makes it beatable: a sharply angled shot travels sideways faster than the
// paddle can chase it vertically.

import { AI } from "./constants.mjs";

export function aiInput(state, side = "right") {
  const diff = state.ball.y - state.paddles[side].y;
  if (Math.abs(diff) < AI.deadZone) return 0;
  return Math.sign(diff);
}
