// One tick of Breakout. Input is a single analog axis (-1..1) for the one
// paddle — Pong's input object collapsed to a number.

import { DT, PADDLE, BALL, BRICKS } from "./constants.mjs";
import { placeBall } from "./state.mjs";
import { transition } from "./machine.mjs";
import { clamp } from "../../shared/math.mjs";

function movePaddle(state, dir) {
  const push = clamp(dir, -1, 1); // analog input, like Pong's paddles
  if (!push) return;
  const half = state.paddle.width / 2;
  state.paddle.x = clamp(
    state.paddle.x + push * PADDLE.speed * DT,
    half,
    state.width - half
  );
}

// Pong's paddle bounce rotated 90°: the ball is re-AIMED by where it lands
// on the paddle. Angle is measured from straight up — center hit rises
// vertically, edge hit flies out at BALL.maxBounceAngle.
function bounceOffPaddle(state) {
  const ball = state.ball;
  if (ball.vy <= 0) return false; // only a falling ball can land on it

  const half = BALL.size / 2;
  const top = PADDLE.y - PADDLE.height / 2;
  if (ball.y + half < top) return false; // hasn't reached the paddle line
  if (ball.y - half > PADDLE.y + PADDLE.height / 2) return false; // already past — it's gone

  const offset = (ball.x - state.paddle.x) / (state.paddle.width / 2 + half);
  if (Math.abs(offset) > 1) return false; // missed sideways

  const speed = Math.min(
    BALL.maxSpeed,
    Math.hypot(ball.vx, ball.vy) * BALL.speedUp
  );
  const angle = offset * BALL.maxBounceAngle;
  ball.vx = Math.sin(angle) * speed;
  ball.vy = -Math.cos(angle) * speed;
  ball.y = top - half; // sit flush on the paddle, never inside it
  return true;
}

// The new collision idea: ball (a square) vs brick (a rectangle), both
// axis-aligned — "AABB vs AABB". When they overlap, which face did the
// ball come through? Answer: the axis where the overlap is SHALLOWEST is
// the axis of impact, so that's the velocity component to flip. A ball
// skimming a brick's underside overlaps it a sliver in y but deeply in x
// → flip vy. One brick per tick is plenty at these speeds.
function hitBrick(state) {
  const ball = state.ball;
  const half = BALL.size / 2;

  for (let i = 0; i < state.bricks.length; i++) {
    const b = state.bricks[i];
    const overlapX = Math.min(
      ball.x + half - b.x,
      b.x + BRICKS.width - (ball.x - half)
    );
    const overlapY = Math.min(
      ball.y + half - b.y,
      b.y + BRICKS.height - (ball.y - half)
    );
    if (overlapX <= 0 || overlapY <= 0) continue; // no overlap on some axis → no hit

    if (overlapX < overlapY) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }
    state.score += b.points;
    state.bricks.splice(i, 1);
    return b; // the destroyed brick — its facts become the event payload
  }
  return null;
}

// Returns EVENTS AS DATA: an array of { type, ...payload } objects — the
// richest vocabulary yet ("wall", "paddle", "brick", "lostBall", "cleared",
// "died"), and Breakout is why events are an ARRAY: one tick can bounce
// off a wall AND smash a brick. The shell still needs zero rule knowledge
// to turn them into pixels and bleeps.
export function step(state, input = 0) {
  // Serving: the world is half-alive. The paddle moves (that's the aiming),
  // the glued ball rides along, and no physics runs until launch().
  if (state.status === "serving") {
    movePaddle(state, input);
    state.ball.x = state.paddle.x;
    return [];
  }

  if (state.status !== "playing") return [];

  movePaddle(state, input);

  const ball = state.ball;
  ball.x += ball.vx * DT;
  ball.y += ball.vy * DT;

  const events = [];
  const half = BALL.size / 2;

  // Three mirror walls. The bottom is deliberately absent — that's the pit.
  if (ball.x - half < 0 && ball.vx < 0) {
    ball.x = half;
    ball.vx = -ball.vx;
    events.push({ type: "wall" });
  } else if (ball.x + half > state.width && ball.vx > 0) {
    ball.x = state.width - half;
    ball.vx = -ball.vx;
    events.push({ type: "wall" });
  }
  if (ball.y - half < 0 && ball.vy < 0) {
    ball.y = half;
    ball.vy = -ball.vy;
    events.push({ type: "wall" });
  }

  if (bounceOffPaddle(state)) events.push({ type: "paddle" });

  const brick = hitBrick(state);
  if (brick) {
    events.push({
      type: "brick",
      points: brick.points,
      row: brick.row,
      remaining: state.bricks.length,
    });
    if (state.bricks.length === 0) {
      transition(state, "cleared"); // the win condition Snake and Pong never had
      events.push({ type: "cleared" });
      return events;
    }
  }

  // Into the pit: lose a life, or the game.
  if (ball.y - half > state.height) {
    state.lives -= 1;
    if (state.lives <= 0) {
      transition(state, "gameover");
      events.push({ type: "died" });
    } else {
      // Back to serving — glued to the paddle, waiting for the player.
      transition(state, "serving");
      state.ball = placeBall(state);
      events.push({ type: "lostBall", livesLeft: state.lives });
    }
  }

  return events;
}

// The player's launch action — the serving → playing transition. Fires the
// glued ball upward at a random slight angle (sin = sideways share, -cos =
// upward share; canvas y grows downward).
export function launch(state) {
  if (state.status !== "serving") return [];
  transition(state, "playing");
  const angle = (state.random() * 2 - 1) * BALL.serveMaxAngle;
  state.ball.vx = Math.sin(angle) * BALL.serveSpeed;
  state.ball.vy = -Math.cos(angle) * BALL.serveSpeed;
  return [{ type: "launched" }];
}
