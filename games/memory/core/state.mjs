// The shape of the world: a shuffled deck of pairs, all face down. The
// interesting state — where everything IS — lives in the player's head.

import { DECK } from "./constants.mjs";

export function createState({ random = Math.random, pairs = DECK.pairs } = {}) {
  // Each value twice, then a Fisher–Yates shuffle: every permutation
  // equally likely, no rejection sampling, deterministic under the
  // injected random.
  const values = Array.from({ length: pairs * 2 }, (_, i) => (i % pairs) + 1);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  return {
    random,
    pairs,
    cards: values.map((value) => ({ value, faceUp: false, matched: false })),
    moves: 0, // pair ATTEMPTS — fewest wins
    status: "playing",
  };
}
