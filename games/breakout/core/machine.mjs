// Breakout's status graph — the biggest machine in the catalog:
//
//              launch
//   serving ──────────▶ playing ──▶ cleared    (last brick)
//      ▲                   │
//      └───────────────────┼──────▶ gameover   (last life)
//          lost a ball     │
//
// Four states, five transitions — the graph that justified formalizing
// status handling in the first place. The graph is Breakout's data; the
// guard mechanism (createMachine) is shared by every game.
//
// gameover/cleared have no exits: restarting is not a transition — the
// shell throws the whole world away and calls createState() again.
// Keeping "reset everything" out of the machine is what keeps it small.

import { createMachine } from "../../../shared/machine.mjs";

export const TRANSITIONS = {
  serving: ["playing"],
  playing: ["serving", "cleared", "gameover"],
  cleared: [],
  gameover: [],
};

export const { transition, can } = createMachine(TRANSITIONS);
