// One tick of the descent. Asteroids' flight model with the thruster
// weakened, drag removed — and one force that never lets go: gravity.
// Input: { turn: -1..1, thrust: 0..1 }.

import { DT, SHIP } from "./constants.mjs";
import { groundAt } from "./state.mjs";
import { transition } from "./machine.mjs";
import { clamp, wrap } from "../../../shared/math.mjs";

// Tilt: the ship's angular distance from upright (-π/2), measured AROUND
// the circle — a full pirouette comes back to zero, not to 2π. One
// formula for the landing rule and the instrument panel, like Missiles'
// blastRadius: what the panel shows green is exactly what the struts hold.
export function tiltOf(angle) {
  return Math.abs(wrap(angle + Math.PI / 2 + Math.PI, 2 * Math.PI) - Math.PI);
}

export function step(state, input = {}) {
  if (state.status !== "playing") return [];

  const events = [];
  const ship = state.ship;

  const turn = clamp(input.turn ?? 0, -1, 1);
  ship.angle += turn * SHIP.turnSpeed * DT;

  // The pedal only works while there's something in the tank.
  const wanted = clamp(input.thrust ?? 0, 0, 1);
  const push = state.fuel > 0 ? wanted : 0;
  state.thrusting = push > 0;
  if (push > 0) {
    ship.vx += Math.cos(ship.angle) * SHIP.thrust * push * DT;
    ship.vy += Math.sin(ship.angle) * SHIP.thrust * push * DT;
    state.fuel = Math.max(0, state.fuel - SHIP.burn * push * DT);
  }

  ship.vy += SHIP.gravity * DT; // gravity never sleeps

  ship.x = wrap(ship.x + ship.vx * DT, state.width);
  ship.y += ship.vy * DT;

  // The ground has an opinion about every touch. Landing needs all
  // three: gentle, upright, and on a LEVEL segment — slopes tip you over
  // no matter how sweetly you arrive.
  const ground = groundAt(state, ship.x);
  if (ship.y + SHIP.radius >= ground.y) {
    ship.y = ground.y - SHIP.radius;
    const speed = Math.hypot(ship.vx, ship.vy);
    const tilt = tiltOf(ship.angle);
    if (ground.level && speed <= SHIP.maxLandSpeed && tilt <= SHIP.maxLandTilt) {
      transition(state, "landed");
      state.score = Math.round(state.fuel); // unburned fuel IS the score
      events.push({ type: "landed", fuel: state.score });
    } else {
      transition(state, "crashed");
      events.push({ type: "crashed" });
    }
  }

  return events;
}
