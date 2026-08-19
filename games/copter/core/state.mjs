// The shape of the world: momentum, distance, and a centerline that
// invents itself — Racer's lazy road, drawn as a tunnel.

import { CAVE, SHIP, TUNNEL } from "./constants.mjs";

export function centerAt(state, d) {
  const i = Math.max(0, Math.floor(d / TUNNEL.segment));
  const a = state.cave[Math.min(i, state.cave.length - 1)] ?? 0;
  const b = state.cave[Math.min(i + 1, state.cave.length - 1)] ?? a;
  const t = (d - i * TUNNEL.segment) / TUNNEL.segment;
  const s = t * t * (3 - 2 * t); // smoothstep — bends arrive gently
  return CAVE.height / 2 + a + (b - a) * s;
}

// The squeeze: the half-gap narrows with distance, down to a floor. The
// narrowing rate is a setting, stored as plain state.
export function gapAt(state, d) {
  return Math.max(TUNNEL.gapMin, TUNNEL.gapStart - d * state.narrow);
}

export function extendCave(state) {
  const needed = Math.floor((state.distance + TUNNEL.lookahead) / TUNNEL.segment) + 2;
  while (state.cave.length < needed) {
    state.cave.push((state.random() * 2 - 1) * TUNNEL.wander);
  }
}

export function createState({ random = Math.random, narrow = 0.0045 } = {}) {
  const state = {
    random,
    y: CAVE.height / 2,
    vy: 0,
    distance: 0,
    cave: [0, 0], // the entrance is always straight
    narrow,
    score: 0,
    status: "ready", // the rotor waits for the first press
  };
  extendCave(state);
  return state;
}
