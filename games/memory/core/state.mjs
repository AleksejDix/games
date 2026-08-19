// The shape of the world: a shuffled deck of pairs, all face down. The
// interesting state — where everything IS — lives in the player's head.

import { DECK } from "./constants.mjs";
import { shuffle } from "../../../shared/random.mjs";

export function createState({ random = Math.random, pairs = DECK.pairs, players = 1 } = {}) {
  // Each value twice, then a Fisher–Yates shuffle (shared/random.mjs):
  // every permutation equally likely, deterministic under the injected
  // random.
  const values = shuffle(
    Array.from({ length: pairs * 2 }, (_, i) => (i % pairs) + 1),
    random
  );

  return {
    random,
    pairs,
    players, // 1 = solo (fewest tries), 2 = Pelmanism proper (most pairs)
    turn: 0, // whose flip it is — always 0 when solo
    won: Array(players).fill(0), // pairs collected, per player
    cards: values.map((value) => ({ value, faceUp: false, matched: false })),
    moves: 0, // pair ATTEMPTS — fewest wins (the solo record)
    status: "playing",
  };
}
