// The shape of the world: a car, a clock, and a road that invents itself.

import { COURT, SPEED, ROAD, TIME, TRAFFIC } from "./constants.mjs";

// The road is a list of centerline OFFSETS, one per segment of distance,
// extended lazily as you drive (see extendRoad). Between control points
// the center eases with smoothstep, so curves arrive gently instead of
// as corners.
export function centerAt(state, d) {
  const i = Math.max(0, Math.floor(d / ROAD.segment));
  const a = state.road[Math.min(i, state.road.length - 1)] ?? 0;
  const b = state.road[Math.min(i + 1, state.road.length - 1)] ?? a;
  const t = (d - i * ROAD.segment) / ROAD.segment;
  const s = t * t * (3 - 2 * t); // smoothstep: zero slope at both ends
  return state.width / 2 + a + (b - a) * s;
}

// Keep the road generated past the horizon. Lazy generation means the
// road is exactly as long as the run that drove it — and deterministic,
// because the offsets come from the injected random.
export function extendRoad(state) {
  const needed = Math.floor((state.distance + ROAD.lookahead) / ROAD.segment) + 2;
  while (state.road.length < needed) {
    state.road.push((state.random() * 2 - 1) * ROAD.wander);
  }
}

export function createState({
  random = Math.random,
  time = TIME.start,
  trafficRate = TRAFFIC.rate,
} = {}) {
  const state = {
    width: COURT.width,
    height: COURT.height,
    random,
    car: { x: COURT.width / 2 },
    speed: SPEED.min,
    distance: 0, // the real position — the car's screen spot never changes
    road: [0, 0], // the start is always a straight
    traffic: [], // { x, d, passed } — d is a world distance, like ours
    passes: 0,
    time,
    trafficRate, // a setting → plain state
    nextCheckpoint: TIME.checkpointEvery,
    shield: 0,
    score: 0,
    status: "playing",
  };
  extendRoad(state);
  return state;
}
