// All tuning values in one place. Units are abstract "court units" — the
// shell happens to map 1 unit = 1 pixel, but the core doesn't know that.
// Speeds are units PER SECOND, converted to per-tick via DT.

// The court. Wider than tall, like the 1972 original's 4:3-ish table.
export const COURT = { width: 800, height: 500 };

// One tick of simulation = 1/120 s. Snake ticked ~8 times a second because
// its world moved one whole cell at a time; continuous physics needs finer
// slices or fast balls visibly "teleport" between frames.
export const DT = 1 / 120;

// margin = gap between the wall and the paddle's back. y refers to the
// paddle's CENTER throughout the core — symmetric math, no top/bottom bias.
export const PADDLE = { width: 12, height: 80, speed: 320, margin: 24 };

export const BALL = {
  size: 12, // a square, like the original — circles came later
  serveSpeed: 280,
  serveMaxAngle: Math.PI / 5, // serves stay within ±36° of horizontal
  speedUp: 1.05, // every paddle hit multiplies speed — rallies escalate
  maxSpeed: 640, // ...up to a cap, so the game stays humanly playable
  maxBounceAngle: Math.PI / 3, // edge-of-paddle hit deflects at 60°
};

export const WIN_SCORE = 11; // classic Pong plays to 11

// The AI ignores differences smaller than the dead zone — without it the
// paddle vibrates around the ball's row, overshooting every tick.
export const AI = { deadZone: 10 };
