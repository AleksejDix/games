// The clocked lawn: the countdown, the ducking, the popping. whack() is
// the pointer action — the mallet.

import { DT, WHAC } from "./constants.mjs";
import { transition } from "./machine.mjs";
import { pick } from "../../../shared/random.mjs";

export function step(state) {
  if (state.status !== "playing") return [];

  state.time -= DT;
  if (state.time <= 0) {
    state.time = 0;
    transition(state, "gameover");
    return [{ type: "timeUp" }];
  }

  // Moles duck on their own — patience is not rewarded here.
  for (let i = 0; i < state.holes.length; i++) {
    if (state.holes[i] > 0) state.holes[i] -= 1;
  }

  // Chance-per-tick popping, into free holes only.
  if (state.random() < state.rate * DT) {
    const free = state.holes.flatMap((h, i) => (h === 0 ? [i] : []));
    if (free.length > 0) {
      state.holes[pick(free, state.random)] = WHAC.upTicks;
      return [{ type: "popped" }];
    }
  }
  return [];
}

export function whack(state, index) {
  if (state.status !== "playing") return [];
  if (state.holes[index] > 0) {
    state.holes[index] = 0;
    state.score += WHAC.points;
    return [{ type: "whacked", index }];
  }
  return [{ type: "whiffed" }];
}
