// One verb and one clock. flap() is the entire input vocabulary.

import { SKY, DT, BIRD, PIPES, GROUND } from "./constants.mjs";
import { extendPipes } from "./state.mjs";
import { transition } from "./machine.mjs";
import { clamp } from "../../../shared/math.mjs";

export function flap(state) {
  if (state.status === "ready") {
    transition(state, "playing"); // the first flap starts the world
  } else if (state.status !== "playing") {
    return [];
  }
  state.bird.vy = BIRD.flap; // an impulse: SET, not added — that's the feel
  return [{ type: "flapped" }];
}

export function step(state) {
  if (state.status !== "playing") return [];

  const events = [];
  const bird = state.bird;

  bird.vy = clamp(bird.vy + BIRD.gravity * DT, BIRD.flap, BIRD.maxFall);
  bird.y += bird.vy * DT;

  // The ceiling forgives; the ground does not.
  if (bird.y < BIRD.r) {
    bird.y = BIRD.r;
    bird.vy = 0;
  }

  state.distance += PIPES.speed * DT;
  extendPipes(state);
  state.pipes = state.pipes.filter((p) => p.x > state.distance - PIPES.width);

  const groundY = SKY.height - GROUND;
  let dead = bird.y + BIRD.r >= groundY;

  for (const pipe of state.pipes) {
    const screenX = pipe.x - state.distance;
    const inPipe =
      BIRD.x + BIRD.r > screenX && BIRD.x - BIRD.r < screenX + PIPES.width;
    if (inPipe) {
      const half = state.gap / 2;
      if (bird.y - BIRD.r < pipe.gapY - half || bird.y + BIRD.r > pipe.gapY + half) {
        dead = true;
      }
    }
    // The pay line: the pipe's trailing edge slides past the bird.
    if (!pipe.passed && pipe.x + PIPES.width < state.distance + BIRD.x) {
      pipe.passed = true;
      state.score += 1;
      events.push({ type: "passed", score: state.score });
    }
  }

  if (dead) {
    transition(state, "gameover");
    events.push({ type: "died" });
  }
  return events;
}
