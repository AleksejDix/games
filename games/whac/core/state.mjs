// The shape of the world: nine numbers. 0 = an empty hole; above zero =
// a mole, counting down the ticks until it ducks.

import { WHAC } from "./constants.mjs";

export function createState({ random = Math.random, rate = WHAC.rate, started = false } = {}) {
  return {
    random,
    holes: Array(WHAC.holes).fill(0),
    time: WHAC.time,
    rate, // a setting → plain state
    score: 0,
    status: started ? "playing" : "ready",
  };
}
