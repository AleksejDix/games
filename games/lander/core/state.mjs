// The shape of the world: a ship, a fuel gauge, and the ground.

import { SKY, SHIP, TERRAIN } from "./constants.mjs";

// The moon as a polyline: random heights, then a few segments hammered
// flat — those are the pads. The rule that makes them special is
// elsewhere and elegant: ANY level segment is landable, so the terrain
// data needs no pad flags at all.
export function createTerrain(state) {
  const points = [];
  for (let i = 0; i <= TERRAIN.points; i++) {
    points.push({
      x: (state.width * i) / TERRAIN.points,
      y: TERRAIN.minY + state.random() * (TERRAIN.maxY - TERRAIN.minY),
    });
  }
  for (let p = 0; p < TERRAIN.padCount; p++) {
    const i = 1 + Math.floor(state.random() * (TERRAIN.points - 2));
    points[i + 1].y = points[i].y;
  }
  return points;
}

// The ground height under x, by linear interpolation along the segment —
// plus whether that segment is level (i.e. landable).
export function groundAt(state, x) {
  const pts = state.terrain;
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i].x && x <= pts[i + 1].x) {
      const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
      return {
        y: pts[i].y + t * (pts[i + 1].y - pts[i].y),
        level: pts[i].y === pts[i + 1].y,
      };
    }
  }
  return { y: state.height, level: false };
}

export function createState({
  random = Math.random,
  fuel = SHIP.fuel,
  started = false, // true skips ready — thumbnails and tests
} = {}) {
  const state = {
    width: SKY.width,
    height: SKY.height,
    random,
    ship: {
      x: SKY.width * 0.2,
      y: 60,
      vx: 30, // drifting in from orbit
      vy: 0,
      angle: -Math.PI / 2, // upright
    },
    thrusting: false, // for the renderer's flame
    fuel,
    fuelMax: fuel, // the starting budget — the gauge's 100% mark
    terrain: [],
    score: 0, // set on touchdown: the fuel you didn't burn
    status: started ? "playing" : "ready",
  };
  state.terrain = createTerrain(state);
  return state;
}
