// The status STATE MACHINE, made explicit.
//
// Snake and Pong keep a bare status string — two states, one transition,
// nothing to get wrong. Breakout's graph grew to four states:
//
//              launch
//   serving ──────────▶ playing ──▶ cleared    (last brick)
//      ▲                   │
//      └───────────────────┼──────▶ gameover   (last life)
//          lost a ball     │
//
// Four states, five transitions — now a table documents the graph and a
// guard turns an illegal jump into a loud error instead of a silent
// corruption. That's all a state machine IS; no library required.
//
// Note what's missing: gameover/cleared have no exits. Restarting is not a
// transition — the shell throws the whole world away and calls
// createState() again. Keeping "reset everything" out of the machine is
// what keeps the machine this small.

export const TRANSITIONS = {
  serving: ["playing"],
  playing: ["serving", "cleared", "gameover"],
  cleared: [],
  gameover: [],
};

export function transition(state, to) {
  if (!TRANSITIONS[state.status]?.includes(to)) {
    throw new Error(`illegal status change: ${state.status} → ${to}`);
  }
  state.status = to;
}
