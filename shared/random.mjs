// Randomness mechanisms for cores — every function takes the INJECTED
// random, keeping the determinism contract: same random stream, same game.

// A whole stream from one 32-bit seed — mulberry32. The mixing is
// integer-only (Math.imul, shifts), operations ECMAScript pins exactly,
// so every engine — the browser that plays, the server that verifies —
// produces the SAME stream from the same seed. This is the half of the
// determinism contract Math.random can never sign: record the seed and
// the inputs, and a whole game replays move for move.
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates, in place: every permutation equally likely, no rejection
// sampling. Memory's deck, Tetris' seven-bag.
export function shuffle(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// One element, uniformly.
export function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}

// Chance-per-tick: an average RATE of events per second, rolled once per
// tick — spawning that stays fair at any tick length. Four cores wrote
// `random() < rate * DT` before it had a name.
export function chance(random, ratePerSecond, dt) {
  return random() < ratePerSecond * dt;
}
