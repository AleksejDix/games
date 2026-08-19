// Randomness mechanisms for cores — every function takes the INJECTED
// random, keeping the determinism contract: same random stream, same game.

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
