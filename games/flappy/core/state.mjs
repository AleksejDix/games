// The shape of the world: a bird, its momentum, and a lazy list of pipes
// at WORLD distances (screen x = pipe.x - state.distance).

import { SKY, BIRD, PIPES, GROUND } from "./constants.mjs";

export function extendPipes(state) {
  const horizon = state.distance + SKY.width + 200;
  while ((state.pipes.at(-1)?.x ?? 0) < horizon) {
    const last = state.pipes.at(-1)?.x ?? SKY.width; // first pipe: a full screen away
    const playable = SKY.height - GROUND;
    const lo = PIPES.margin;
    const hi = playable - PIPES.margin;
    state.pipes.push({
      x: last + PIPES.spacing,
      gapY: lo + state.random() * (hi - lo),
      passed: false,
    });
  }
}

export function createState({ random = Math.random, gap = PIPES.gap } = {}) {
  const state = {
    random,
    bird: { y: (SKY.height - GROUND) / 2, vy: 0 },
    distance: 0,
    pipes: [],
    gap, // a setting → plain state
    score: 0,
    status: "ready", // the world waits for the first flap
  };
  extendPipes(state);
  return state;
}
