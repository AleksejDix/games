// The actions of a turn-based world with a SETTLING rule. A mismatched
// pair lingers face-up so the player can memorize it; it turns back down
// when settle() is called — by the shell's timer after a beat, or
// automatically by the next flip. Time stays in the shell, as always;
// the core only knows the rule.

import { transition } from "./machine.mjs";

export function step() {
  return [];
}

const lingering = (state) => state.cards.filter((c) => c.faceUp && !c.matched);

export function settle(state) {
  const pair = lingering(state);
  if (state.status !== "playing" || pair.length !== 2) return [];
  for (const card of pair) card.faceUp = false;
  return [{ type: "settled" }];
}

export function flip(state, index) {
  if (state.status !== "playing") return [];
  const card = state.cards[index];
  if (!card) return [];

  const events = [];
  // A lingering mismatch settles itself when the next flip arrives.
  if (lingering(state).length === 2) events.push(...settle(state));

  if (card.faceUp || card.matched) return events;
  card.faceUp = true;
  events.push({ type: "flipped", index, value: card.value });

  const up = lingering(state);
  if (up.length === 2) {
    state.moves += 1; // the attempt is the pair, not the card
    if (up[0].value === up[1].value) {
      for (const c of up) c.matched = true;
      const remaining = state.cards.filter((c) => !c.matched).length / 2;
      events.push({ type: "matched", value: card.value, remaining });
      if (remaining === 0) {
        transition(state, "solved");
        events.push({ type: "solved", moves: state.moves });
      }
    } else {
      events.push({ type: "mismatched" });
    }
  }
  return events;
}
