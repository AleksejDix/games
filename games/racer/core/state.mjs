// The shape of the world: a car, a clock, and a road that invents itself.

import { COURT, SPEED, ROAD, TIME, TRAFFIC } from "./constants.mjs";
import { smoothSample, extendOffsets } from "../../../shared/world.mjs";

// The road is a list of centerline OFFSETS, one per segment of distance,
// extended lazily as you drive (see extendRoad). Between control points
// the center eases with smoothstep, so curves arrive gently instead of
// as corners.
export function centerAt(state, d) {
  return state.width / 2 + smoothSample(state.road, d, ROAD.segment);
}

// Keep the road generated past the horizon. Lazy generation means the
// road is exactly as long as the run that drove it — and deterministic,
// because the offsets come from the injected random.
export function extendRoad(state) {
  extendOffsets(state.road, state.distance, ROAD.segment, ROAD.lookahead, () =>
    (state.random() * 2 - 1) * ROAD.wander
  );
}

// A traffic car's world x. Its lane is stored relative to the road's
// centerline AT ITS OWN DISTANCE — real drivers steer with the road. A
// car stored at an absolute x would slide onto the grass the moment the
// road bent out from under it (the second bug our test driver found).
export function trafficX(state, t) {
  return centerAt(state, t.d) + t.lane;
}

export function createState({
  random = Math.random,
  time = TIME.start,
  trafficRate = TRAFFIC.rate,
  started = false, // true skips ready — thumbnails and tests
} = {}) {
  const state = {
    width: COURT.width,
    height: COURT.height,
    random,
    car: { x: COURT.width / 2 },
    speed: SPEED.min,
    distance: 0, // the real position — the car's screen spot never changes
    road: [0, 0], // the start is always a straight
    traffic: [], // { lane, d, passed } — lane is RELATIVE to the centerline
    passes: 0,
    time,
    trafficRate, // a setting → plain state
    nextCheckpoint: TIME.checkpointEvery,
    shield: 0,
    score: 0,
    status: started ? "playing" : "ready",
  };
  extendRoad(state);
  return state;
}
