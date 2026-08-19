// Two time models in one crossing: hop() is a discrete tap (Snake), the
// lanes flow on the clock (Pong). The river adds the catalog's first
// MOVING PLATFORM: on a log, the frog's motion is the log's.

import { COURT, DT, CELL, ROWS, HOME_XS, RIVER_ROWS, ROAD_ROWS, FROG, SCORE } from "./constants.mjs";
import { transition } from "./machine.mjs";
import { clamp } from "../../../shared/math.mjs";

export function step(state) {
  if (state.status !== "playing") return [];
  state.tick += 1;

  // The lanes flow; items wrap around an extended span so they re-enter.
  for (const lane of state.lanes) {
    if (!lane) continue;
    const span = COURT.width + lane.w;
    for (const item of lane.items) {
      item.x += lane.dir * lane.speed * state.pace * DT;
      if (item.x > COURT.width + lane.w / 2) item.x -= span;
      if (item.x < -lane.w / 2) item.x += span;
    }
  }

  const lane = state.lanes[state.frog.row];
  if (lane) {
    const carrier = lane.items.find(
      (item) => Math.abs(item.x - state.frog.x) < lane.w / 2 + FROG.r / 2
    );
    if (RIVER_ROWS.includes(state.frog.row)) {
      if (!carrier) return croak(state); // swimming is not hopping
      // The moving platform: the frog's motion IS the log's.
      state.frog.x += lane.dir * lane.speed * state.pace * DT;
      if (state.frog.x < 0 || state.frog.x > COURT.width) return croak(state);
    } else if (ROAD_ROWS.includes(state.frog.row) && carrier) {
      return croak(state); // on the road, company kills
    }
  }
  return [];
}

function croak(state) {
  state.lives -= 1;
  if (state.lives <= 0) {
    transition(state, "gameover");
    return [{ type: "died" }];
  }
  state.frog = { x: COURT.width / 2, row: ROWS - 1 };
  return [{ type: "croaked", livesLeft: state.lives }];
}

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function hop(state, dir) {
  if (state.status !== "playing") return [];
  const [dx, dy] = DIRS[dir] ?? [0, 0];
  if (dx === 0 && dy === 0) return [];

  const x = clamp(state.frog.x + dx * CELL, CELL / 2, COURT.width - CELL / 2);
  const row = clamp(state.frog.row + dy, 0, ROWS - 1);
  if (x === state.frog.x && row === state.frog.row) return [];

  // The top row is home bays and hedge — resolve the landing immediately.
  if (row === 0) {
    const bay = HOME_XS.findIndex(
      (hx, i) => !state.homes[i] && Math.abs(hx - x) < CELL / 2
    );
    if (bay === -1) return croak(state); // the hedge, or a full bay
    state.homes[bay] = true;
    state.score += SCORE.home;
    state.frog = { x: COURT.width / 2, row: ROWS - 1 };
    const left = state.homes.filter((h) => !h).length;
    const events = [{ type: "home", left }];
    if (left === 0) {
      state.homes = state.homes.map(() => false);
      state.pace += 0.15; // the river remembers you beat it
      state.score += SCORE.clear;
      events.push({ type: "cleared", level: Math.round((state.pace - 1) / 0.15) + 1 });
    }
    return events;
  }

  state.frog.x = x;
  state.frog.row = row;
  return [{ type: "hopped" }];
}
