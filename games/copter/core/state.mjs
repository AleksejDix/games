// The shape of the world: momentum, distance, and a centerline that
// invents itself — Racer's lazy road, drawn as a tunnel.

import { CAVE, SHIP, TUNNEL, BLOCKS } from "./constants.mjs";
import { smoothSample, extendOffsets, extendSpaced } from "../../../shared/world.mjs";

export function centerAt(state, d) {
  return CAVE.height / 2 + smoothSample(state.cave, d, TUNNEL.segment);
}

// The squeeze: the half-gap narrows with distance, down to a floor. The
// narrowing rate is a setting, stored as plain state.
export function gapAt(state, d) {
  return Math.max(TUNNEL.gapMin, TUNNEL.gapStart - d * state.narrow);
}

export function extendCave(state) {
  extendOffsets(state.cave, state.distance, TUNNEL.segment, TUNNEL.lookahead, () =>
    (state.random() * 2 - 1) * TUNNEL.wander
  );
}

// Blocks appear on a lazy world-list like the cave itself, each parked
// INSIDE the tunnel at its own distance so a path always remains.
export function extendBlocks(state) {
  extendSpaced(state.blocks, "d", state.distance + TUNNEL.lookahead, BLOCKS.every, BLOCKS.first, (d) => {
    const room = Math.max(0, gapAt(state, d) - BLOCKS.h / 2 - SHIP.r - 8);
    return { d, y: centerAt(state, d) + (state.random() * 2 - 1) * room };
  });
}

export function createState({
  random = Math.random,
  narrow = 0.0045,
  started = false, // true skips ready (thumbnails and tests)
} = {}) {
  const state = {
    random,
    y: CAVE.height / 2,
    vy: 0,
    distance: 0,
    cave: [0, 0], // the entrance is always straight
    blocks: [], // the floating obstacles, at world distances
    trail: [], // recent flight positions — the smoke, cosmetic but honest
    narrow,
    score: 0,
    status: started ? "playing" : "ready", // the rotor waits for the first press
    tick: 0, // world time: +1 per simulated step (replays anchor to it)
  };
  extendCave(state);
  extendBlocks(state);
  return state;
}
