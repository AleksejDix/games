// The shape of the world: a bird, its momentum, and a lazy list of pipes
// at WORLD distances (screen x = pipe.x - state.distance).

import { SKY, BIRD, PIPES, GROUND } from "./constants.mjs";
import { extendSpaced } from "../../../shared/world.mjs";

export function extendPipes(state) {
  const lo = PIPES.margin;
  const hi = SKY.height - GROUND - PIPES.margin;
  extendSpaced(
    state.pipes,
    "x",
    state.distance + SKY.width + 200 + PIPES.spacing,
    PIPES.spacing,
    SKY.width + PIPES.spacing, // the first pipe: a full screen away
    (x) => ({ x, gapY: lo + state.random() * (hi - lo), passed: false })
  );
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
