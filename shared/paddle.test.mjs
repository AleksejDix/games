// The paddle mechanisms, tested once here — Pong's and Breakout's suites
// cover them again in context, in both orientations.

import { test } from "node:test";
import assert from "node:assert/strict";
import { slidePaddle, crossedFace, catchOffset, rallySpeed, reaim } from "./paddle.mjs";

test("slidePaddle clamps both the input and the court", () => {
  assert.equal(slidePaddle(100, 1, 60, 0.5, 0, 200), 130);
  assert.equal(slidePaddle(100, 5, 60, 0.5, 0, 200), 130, "input caps at ±1");
  assert.equal(slidePaddle(190, 1, 60, 0.5, 0, 200), 200, "rails hold");
  assert.equal(slidePaddle(100, 0, 60, 0.5, 0, 200), 100, "no push, no move");
});

test("crossedFace catches the crossing tick — including a tunneled one", () => {
  assert.ok(crossedFace(105, 95, 100, 1), "crossed this tick");
  assert.ok(crossedFace(140, 95, 100, 1), "tunneled far past — still this tick");
  assert.ok(!crossedFace(95, 85, 100, 1), "not there yet");
  assert.ok(!crossedFace(110, 105, 100, 1), "already past before the tick — the late slide is refused");
  assert.ok(crossedFace(95, 105, 100, -1), "same rules approaching from the other side");
  assert.ok(!crossedFace(90, 95, 100, -1), "already past, other side");
});

test("catchOffset maps the strike to [-1, 1] and misses to null", () => {
  assert.equal(catchOffset(50, 50, 40), 0, "dead center");
  assert.equal(catchOffset(90, 50, 40), 1, "edge graze counts");
  assert.equal(catchOffset(30, 50, 40), -0.5);
  assert.equal(catchOffset(91, 50, 40), null, "past the edge sails on");
});

test("rallySpeed accelerates and caps", () => {
  assert.equal(rallySpeed(300, 400, 1.1, 1000), 550);
  assert.equal(rallySpeed(300, 400, 1.1, 520), 520, "the cap holds");
});

test("reaim splits the speed against the face by the strike offset", () => {
  const center = reaim(0, 500, Math.PI / 3);
  assert.equal(center.out, 500, "a center hit leaves straight out");
  assert.equal(center.across, 0);
  const edge = reaim(1, 500, Math.PI / 6);
  assert.ok(Math.abs(Math.hypot(edge.out, edge.across) - 500) < 1e-9, "re-aiming never changes speed");
  assert.ok(edge.across > 0 && edge.out > 0, "an edge hit angles across, still outward");
});
