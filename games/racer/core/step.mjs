// One tick of the run. Input: { steer: -1..1, gas: 0..1, brake: 0..1 }.
//
// The scrolling-world idea: the car's screen position never changes —
// `distance` advances instead, and everything else (road, traffic,
// checkpoints) lives at world distances. Passing happens by RELATIVE
// speed: traffic drives forward too, so you only gain on what you
// out-run.

import { DT, CAR, SPEED, ROAD, TRAFFIC, TIME } from "./constants.mjs";
import { centerAt, extendRoad, trafficX } from "./state.mjs";
import { transition } from "./machine.mjs";
import { clamp } from "../../../shared/math.mjs";
import { chance } from "../../../shared/random.mjs";

// A crash never ends the run — it ends your MOMENTUM. Speed resets,
// a shield covers the recovery, and the clock keeps draining, which is
// the real price.
function crash(state, cause, events) {
  state.speed = SPEED.min;
  state.shield = CAR.shield;
  events.push({ type: "crashed", cause });
}

export function step(state, input = {}) {
  if (state.status !== "playing") return [];

  const events = [];

  if (state.shield > 0) state.shield -= 1;

  // --- the clock, the only killer ---------------------------------------------
  state.time -= DT;
  if (state.time <= 0) {
    state.time = 0;
    transition(state, "gameover");
    events.push({ type: "died", cause: "time" });
    return events;
  }

  // --- pedals and wheel --------------------------------------------------------
  const gas = clamp(input.gas ?? 0, 0, 1);
  const brake = clamp(input.brake ?? 0, 0, 1);
  if (gas > 0) {
    state.speed += SPEED.accel * gas * DT;
  } else if (brake > 0) {
    state.speed -= SPEED.brake * brake * DT;
  } else {
    state.speed -= SPEED.coast * DT; // drag never rests
  }
  state.speed = clamp(state.speed, SPEED.min, SPEED.max);

  const steer = clamp(input.steer ?? 0, -1, 1);
  state.car.x = clamp(
    state.car.x + steer * CAR.steer * DT,
    CAR.width / 2,
    state.width - CAR.width / 2
  );

  // --- the world streams past ---------------------------------------------------
  state.distance += state.speed * DT;
  extendRoad(state);

  // Traffic joins just over the horizon, spread across a jitter window so
  // arrivals aren't rhythmic. Only the LANE is stored — the road decides
  // where that lane is at any distance (see trafficX).
  if (
    state.traffic.length < TRAFFIC.max &&
    chance(state.random, state.trafficRate, DT)
  ) {
    const d = state.distance + TRAFFIC.spawnAhead + state.random() * TRAFFIC.jitter;
    const lane = (state.random() * 2 - 1) * (ROAD.halfWidth - TRAFFIC.width);
    state.traffic.push({ lane, d, passed: false });
  }

  for (const t of state.traffic) {
    t.d += TRAFFIC.speed * DT;
    // The pass: the moment a car falls behind our distance.
    if (!t.passed && t.d < state.distance) {
      t.passed = true;
      state.passes += 1;
      events.push({ type: "passed", points: TRAFFIC.points });
    }
  }
  // Cull both ways: passed cars once well behind, and anything that
  // somehow escapes far ahead — escapees must never clog the spawn cap.
  state.traffic = state.traffic.filter(
    (t) =>
      t.d > state.distance - 300 &&
      t.d - state.distance < TRAFFIC.spawnAhead + TRAFFIC.jitter + 100
  );

  // --- contact ------------------------------------------------------------------
  if (state.shield === 0) {
    const hit = state.traffic.findIndex(
      (t) =>
        Math.abs(trafficX(state, t) - state.car.x) < (CAR.width + TRAFFIC.width) / 2 &&
        Math.abs(t.d - state.distance) < (CAR.height + TRAFFIC.height) / 2
    );
    if (hit !== -1) {
      state.traffic.splice(hit, 1); // the wreck is cleared
      crash(state, "traffic", events);
    } else {
      const center = centerAt(state, state.distance);
      const room = ROAD.halfWidth - CAR.width / 2;
      if (Math.abs(state.car.x - center) > room) {
        state.car.x = clamp(state.car.x, center - room, center + room);
        crash(state, "offroad", events);
      }
    }
  }

  // --- checkpoints ----------------------------------------------------------------
  if (state.distance >= state.nextCheckpoint) {
    state.time += TIME.checkpointBonus;
    state.nextCheckpoint += TIME.checkpointEvery;
    events.push({ type: "checkpoint", timeBonus: TIME.checkpointBonus });
  }

  // Score is derived, not accumulated: distance driven plus passes made.
  state.score = Math.floor(state.distance / 20) + state.passes * TRAFFIC.points;

  return events;
}
