// One tick of the desert. Input: { jump: bool, duck: bool }.
//
// The dino never moves — the WORLD does. Physics runs in the original's
// frame units (Chromium's dino_game), converted through FPS × DT, and
// collision is the original's two-stage check: whole-sprite rectangles
// trimmed by a pixel, then the tight per-part boxes. That geometry IS
// the forgiveness players remember.

import { DT, FPS, DINO, RUN, TYPES, GROUND_Y } from "./constants.mjs";
import { extendObstacles } from "./state.mjs";
import { transition } from "./machine.mjs";
import { rectsOverlap } from "../../../shared/collide.mjs";

const F = FPS * DT; // frames elapsed per tick (0.5 at 120Hz)

const box = ([x, y, w, h], ox, oy) => ({ x: ox + x, y: oy + y, w, h });

// The original's Obstacle constructor widens the middle box for cactus
// bunches, so the tight boxes span however many trunks spawned.
function obstacleBoxes(o) {
  const boxes = TYPES[o.type].boxes.map((b) => [...b]);
  if (o.size > 1) {
    boxes[1][2] = o.w - boxes[0][2] - boxes[2][2];
    boxes[2][0] = o.w - boxes[2][2];
  }
  return boxes;
}

function collides(state, o) {
  const dino = state.dino;
  const stance = dino.ducking
    ? { w: DINO.duckW, h: DINO.duckH, boxes: DINO.boxes.ducking }
    : { w: DINO.w, h: DINO.h, boxes: DINO.boxes.running };
  const dinoTop = GROUND_Y - stance.h - dino.elev;
  const screenX = o.x - state.distance;

  // Stage one: whole sprites, trimmed by the original's 1px of grace.
  const outerDino = { x: DINO.x + 1, y: dinoTop + 1, w: stance.w - 2, h: stance.h - 2 };
  const outerObs = { x: screenX + 1, y: o.y + 1, w: o.w - 2, h: o.h - 2 };
  if (!rectsOverlap(outerDino, outerObs)) return false;

  // Stage two: any tight part against any tight part.
  for (const d of stance.boxes) {
    for (const t of obstacleBoxes(o)) {
      if (rectsOverlap(box(d, DINO.x, dinoTop), box(t, screenX, o.y))) return true;
    }
  }
  return false;
}

export function step(state, input = {}) {
  // ready: the T-rex stands frozen in the error page until the first
  // jump (or duck) — the touch starts the run AND acts, like the original.
  if (state.status === "ready" && (input.jump || input.duck)) {
    transition(state, "playing");
  }
  if (state.status !== "playing") return [];

  const events = [];
  const dino = state.dino;

  // --- the run: ever faster, up to the cap -----------------------------------
  state.speed = Math.min(RUN.maxSpeed, state.speed + RUN.accel * F);
  state.distance += state.speed * F;

  // Score is distance ÷ 40px, and every 100th point beeps — the famous one.
  const before = state.score;
  state.score = Math.floor(state.distance / RUN.scorePer);
  if (Math.floor(state.score / 100) > Math.floor(before / 100)) {
    events.push({ type: "milestone", value: state.score - (state.score % 100) });
  }

  // --- the T-rex: jump, fall, duck --------------------------------------------
  const grounded = dino.elev === 0;
  if (input.jump && grounded) {
    dino.vy = DINO.jump;
    events.push({ type: "jumped" });
  }
  dino.ducking = Boolean(input.duck) && grounded;
  // Holding ↓ mid-air is the original's speed drop: a three-times fall.
  const gravity = DINO.gravity * (input.duck && !grounded ? DINO.speedDrop : 1);
  dino.vy -= gravity * F;
  dino.elev = Math.max(0, dino.elev + dino.vy * F);
  if (dino.elev === 0) dino.vy = Math.max(0, dino.vy);

  // --- the world: birds drift, the horizon restocks, the past is forgotten ----
  for (const o of state.obstacles) o.x -= o.speedOffset * F;
  extendObstacles(state);
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > state.distance - 40);

  // --- collision ---------------------------------------------------------------
  for (const o of state.obstacles) {
    if (o.x - state.distance > DINO.x + DINO.duckW) break; // sorted: rest are ahead
    if (collides(state, o)) {
      transition(state, "gameover");
      events.push({ type: "died" });
      break;
    }
  }

  return events;
}
