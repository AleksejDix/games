// One held button against gravity, forever — or until the wall.

import { DT, SHIP, SCROLL } from "./constants.mjs";
import { centerAt, gapAt, extendCave } from "./state.mjs";
import { transition } from "./machine.mjs";
import { clamp } from "../../../shared/math.mjs";

export function start(state) {
  if (state.status !== "ready") return [];
  transition(state, "playing");
  return [{ type: "started" }];
}

export function step(state, input = {}) {
  if (state.status !== "playing") return [];

  const events = [];

  // The one input: a FORCE while held (Flappy's button is an impulse —
  // same finger, opposite physics).
  state.vy = clamp(
    state.vy + (input.lift ? -SHIP.lift : SHIP.gravity) * DT,
    -SHIP.maxV,
    SHIP.maxV
  );
  state.y += state.vy * DT;

  const before = Math.floor(state.distance / 500);
  state.distance += SCROLL.speed * DT;
  extendCave(state);
  state.score = Math.floor(state.distance / 10);
  if (Math.floor(state.distance / 500) > before) {
    events.push({ type: "milestone" });
  }

  // The tunnel has an opinion about where you are.
  const center = centerAt(state, state.distance);
  if (Math.abs(state.y - center) > gapAt(state, state.distance) - SHIP.r) {
    transition(state, "gameover");
    events.push({ type: "died" });
  }
  return events;
}
