// Chess' status graph — two endings, both final:
//
//   playing ──▶ won    (checkmate — the winner travels as data)
//           └─▶ draw   (stalemate, or the fifty-move rule)
//
// Threefold repetition is deliberately absent: it needs a position
// history the state does not carry, and the shelf's games keep their
// state honest about what they enforce. A rematch is createState().

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  playing: ["won", "draw"],
  won: [],
  draw: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
