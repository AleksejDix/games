// One held button against gravity, forever — or until the wall.

import { DT, SHIP, SCROLL, BLOCKS } from "./constants.mjs";
import { centerAt, gapAt, extendCave, extendBlocks } from "./state.mjs";
import { transition } from "./machine.mjs";
import { pruneBehind } from "../../../shared/world.mjs";
import { clamp } from "../../../shared/math.mjs";

export function start(state) {
  if (state.status !== "ready") return [];
  transition(state, "playing");
  return [{ type: "started" }];
}

export function step(state, input = {}) {
  if (state.status !== "playing") return [];
  state.tick += 1;

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
  extendBlocks(state);
  state.blocks = pruneBehind(state.blocks, state.distance - 100, (b) => b.d);

  // The smoke: a bounded ribbon of where you just were.
  state.trail.push({ d: state.distance, y: state.y });
  if (state.trail.length > 24) state.trail.shift();
  state.score = Math.floor(state.distance / 10);
  if (Math.floor(state.distance / 500) > before) {
    events.push({ type: "milestone" });
  }

  // The tunnel has an opinion about where you are — and so do the blocks.
  const center = centerAt(state, state.distance);
  const wall = Math.abs(state.y - center) > gapAt(state, state.distance) - SHIP.r;
  const block = state.blocks.some(
    (b) =>
      Math.abs(b.d - state.distance) < BLOCKS.w / 2 + SHIP.r &&
      Math.abs(b.y - state.y) < BLOCKS.h / 2 + SHIP.r
  );
  if (wall || block) {
    transition(state, "gameover");
    events.push({ type: "died" });
  }
  return events;
}
