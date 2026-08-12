// The shape of the world, plus serving — Pong's equivalent of spawning food.

import { COURT, BALL } from "./constants.mjs";

// Put the ball at center court, flying toward `toward` ("left" | "right")
// at a random modest angle. Randomness comes from state.random — injected,
// so tests can script the exact serve they need (same pattern as Snake's
// food placement).
export function serve(state, toward) {
  const dir = toward === "left" ? -1 : 1;
  const angle = (state.random() * 2 - 1) * BALL.serveMaxAngle;
  return {
    x: state.width / 2,
    y: state.height / 2,
    // Polar → cartesian: the angle sets the up/down share of a fixed speed.
    vx: Math.cos(angle) * BALL.serveSpeed * dir,
    vy: Math.sin(angle) * BALL.serveSpeed,
  };
}

export function createState({ random = Math.random } = {}) {
  const state = {
    width: COURT.width,
    height: COURT.height,
    random,
    // Only y — paddles slide along a fixed vertical rail, so x is a
    // constant (derived from PADDLE.margin), not state.
    paddles: {
      left: { y: COURT.height / 2 },
      right: { y: COURT.height / 2 },
    },
    ball: null,
    scores: { left: 0, right: 0 },
    status: "playing", // "playing" | "gameover" — pause stays a UI concern
  };
  // Opening serve goes to a random side; after that, serves go to whoever
  // conceded the last point (see step.mjs).
  state.ball = serve(state, state.random() < 0.5 ? "left" : "right");
  return state;
}
