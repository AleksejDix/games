// The actions of a turn-based echo. The shell paces the playback; the
// core only judges the echo, one note at a time.

import { SIMON } from "./constants.mjs";
import { transition } from "./machine.mjs";

export function step() {
  return [];
}

export function press(state, pad) {
  if (state.status !== "playing") return [];
  // Between a completed echo and the next extend() there is no note to
  // judge: progress sits past the end, and comparing the press against
  // sequence[progress] (undefined) would kill an innocent player. The
  // gap-press is simply not part of any echo.
  if (state.progress >= state.sequence.length) return [];
  const events = [{ type: "pressed", pad }];

  if (pad === state.sequence[state.progress]) {
    state.progress += 1;
    if (state.progress === state.sequence.length) {
      state.score = state.sequence.length;
      events.push({ type: "roundComplete", round: state.score });
    }
  } else {
    transition(state, "gameover");
    events.push({ type: "died", round: state.sequence.length - 1 });
  }
  return events;
}

export function extend(state) {
  if (state.status !== "playing") return [];
  state.sequence.push(Math.floor(state.random() * SIMON.pads));
  state.progress = 0;
  return [{ type: "extended" }];
}
