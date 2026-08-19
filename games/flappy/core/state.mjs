// The shape of the world: a bird, its momentum, and a lazy list of pipes
// at WORLD distances (screen x = pipe.x - state.distance).

import { SKY, BIRD, PIPES, GROUND } from "./constants.mjs";
import { extendSpaced } from "../../../shared/world.mjs";

export function extendPipes(state) {
  // The margin holds the gap CENTER away from sky and ground — so it
  // must grow with the gap, or a wide-gap setting would roll gaps poking
  // past the ceiling and negative-height pipes. Half the gap plus a stub
  // guarantees every pipe keeps at least 20 units of visible body.
  const margin = Math.max(PIPES.margin, state.gap / 2 + 20);
  const lo = margin;
  const hi = SKY.height - GROUND - margin;
  extendSpaced(
    state.pipes,
    "x",
    state.distance + SKY.width + 200 + PIPES.spacing,
    PIPES.spacing,
    SKY.width + PIPES.spacing, // the first pipe: a full screen away
    (x) => ({ x, gapY: lo + state.random() * (hi - lo), passed: false })
  );
}

export function createState({
  random = Math.random,
  gap = PIPES.gap,
  started = false, // true skips ready (thumbnails and tests)
} = {}) {
  const state = {
    random,
    bird: { y: (SKY.height - GROUND) / 2, vy: 0 },
    distance: 0,
    pipes: [],
    gap, // a setting → plain state
    score: 0,
    status: started ? "playing" : "ready", // the world waits for the first flap
    tick: 0, // world time: +1 per simulated step (replays anchor to it)
  };
  extendPipes(state);
  return state;
}
